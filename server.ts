import path from 'path';
import dotenv from 'dotenv';

// Enforce SQLite URL for Prisma before loading or overriding env
const defaultSqlitePath = path.resolve(process.cwd(), 'prisma', 'dev.db');
const defaultSqliteUrl = `file:${defaultSqlitePath}`;
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('file:')) {
  process.env.DATABASE_URL = defaultSqliteUrl;
}
dotenv.config();
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('file:')) {
  process.env.DATABASE_URL = defaultSqliteUrl;
}

import express from 'express';
import { createServer as createViteServer } from 'vite';
import { prisma } from './server/db.js';
import { deduplicationEngine } from './server/engine/deduplicator.js';
import { ingestionPipeline } from './server/engine/ingestionPipeline.js';
import { getProvider, listProviders, csvImportProviderInstance } from './server/providers/index.js';
import {
  requireAuth,
  hashPassword,
  comparePassword,
  generateToken,
  ensureDefaultAdminUser,
  AuthenticatedRequest,
} from './server/services/auth.js';
import { emailValidationService } from './server/services/emailValidator.js';
import { leadScorer } from './server/services/leadScorer.js';
import { exportLeadsToCsv } from './server/utils/csvExporter.js';

const PORT = 3000;

async function startServer() {
  const app = express();

  app.use(express.json());

  // Public Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Public Providers metadata list
  app.get('/api/providers', (_req, res) => {
    res.json({ providers: listProviders() });
  });

  // Test live connection to a provider
  app.post('/api/providers/:id/test', requireAuth, async (req, res) => {
    const providerId = req.params.id;
    const startTime = Date.now();
    try {
      const provider = getProvider(providerId);
      const testResult = await provider.search({ limit: 1 });
      const latencyMs = Date.now() - startTime;

      res.json({
        providerId,
        status: 'ONLINE',
        latencyMs,
        sampleItem: testResult.leads[0]?.businessName || 'API Responded Successfully',
        totalAvailable: testResult.totalFound,
      });
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const isDeferred =
        providerId === 'google_places' &&
        (!process.env.GOOGLE_PLACES_API_KEY || err.message.includes('bank verification'));
      const isMissingKey =
        err.message.includes('not configured') ||
        err.message.includes('required') ||
        err.message.includes('API key');

      res.json({
        providerId,
        status: isDeferred ? 'DEFERRED' : isMissingKey ? 'NEEDS_KEY' : 'ERROR',
        latencyMs: isDeferred || isMissingKey ? 0 : latencyMs,
        message: isDeferred
          ? 'Google Places API is optional and currently deferred pending bank verification. The application is fully production-ready using live SEC EDGAR, OpenStreetMap, and CSV ingestion feeds.'
          : err.message,
      });
    }
  });

  // Direct CSV / Dataset Ingestion Endpoint
  app.post('/api/ingest/csv', requireAuth, async (req, res) => {
    try {
      const { csvText, records, autoEnrich = true } = req.body;
      let rawList: any[] = [];

      if (Array.isArray(records) && records.length > 0) {
        rawList = records;
      } else if (typeof csvText === 'string' && csvText.trim()) {
        const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
        if (lines.length < 2) {
          return res.status(400).json({ error: 'CSV must contain a header row and at least one data row' });
        }

        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
        for (let i = 1; i < lines.length; i++) {
          const rowValues = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
          const item: Record<string, string> = {};
          headers.forEach((h, idx) => {
            item[h] = rowValues[idx] || '';
          });
          rawList.push(item);
        }
      } else {
        return res.status(400).json({ error: 'Please provide CSV text or an array of records' });
      }

      // Map parsed items to RawLeadData
      const leads = rawList.map((item, idx) => {
        const businessName = item.businessname || item.business_name || item.company || item.name || `Lead #${idx + 1}`;
        let domain = item.domain || item.website_domain;
        const website = item.website || item.url || (domain ? `https://${domain}` : undefined);
        if (!domain && website) {
          try {
            domain = new URL(website.startsWith('http') ? website : `https://${website}`).hostname.replace(/^www\./, '');
          } catch {}
        }

        return {
          businessName,
          legalName: item.legalname || item.legal_name || businessName,
          domain,
          website,
          phone: item.phone || item.telephone || undefined,
          email: item.email || (domain ? `contact@${domain}` : undefined),
          industry: item.industry || item.sector || 'B2B Enterprise',
          employeeCount: item.employees ? Number(item.employees) : undefined,
          revenueRange: item.revenue || item.revenue_range || undefined,
          street: item.street || item.address || undefined,
          city: item.city || undefined,
          state: item.state || undefined,
          zip: item.zip || item.postal_code || undefined,
          country: item.country || 'USA',
          providerId: `csv-import-${Date.now()}-${idx}`,
          contacts: item.contact_name
            ? [
                {
                  firstName: item.contact_name.split(' ')[0] || 'Executive',
                  lastName: item.contact_name.split(' ').slice(1).join(' ') || 'Contact',
                  title: item.contact_title || item.title || 'Decision Maker',
                  email: item.contact_email || item.email,
                  phone: item.contact_phone || item.phone,
                },
              ]
            : [],
        };
      });

      const batchId = `batch-${Date.now()}`;
      csvImportProviderInstance.stageBatch(batchId, leads);

      const jobId = await ingestionPipeline.startJob({
        providerId: 'csv_import',
        queryParams: { query: batchId },
        targetCount: leads.length,
        autoEnrich: Boolean(autoEnrich),
      });

      res.status(202).json({
        message: `Dataset staged. ${leads.length} records submitted to ingestion pipeline.`,
        jobId,
        recordCount: leads.length,
      });
    } catch (err: any) {
      console.error('[API /api/ingest/csv]', err);
      res.status(500).json({ error: err.message || 'Failed to ingest CSV dataset' });
    }
  });

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  // User Registration
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !email.trim()) {
        return res.status(400).json({ error: 'Email address is required' });
      }

      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (existingUser) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }

      const hashedPassword = await hashPassword(password);
      const isFirstUser = (await prisma.user.count()) === 0;

      const user = await prisma.user.create({
        data: {
          email: cleanEmail,
          password: hashedPassword,
          name: name?.trim() || cleanEmail.split('@')[0],
          role: isFirstUser ? 'ADMIN' : 'MEMBER',
        },
        select: { id: true, email: true, name: true, role: true, created_at: true },
      });

      const token = generateToken(user);

      res.status(201).json({
        message: 'Account created successfully',
        user,
        token,
      });
    } catch (err: any) {
      console.error('[API /api/auth/register]', err);
      res.status(500).json({ error: 'Failed to create account' });
    }
  });

  // User Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });

      res.json({
        message: 'Authentication successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      });
    } catch (err: any) {
      console.error('[API /api/auth/login]', err);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // User Logout
  app.post('/api/auth/logout', (_req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // Get Current Authenticated User
  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  // ==========================================
  // PROTECTED PIPELINE & DASHBOARD ROUTES
  // ==========================================

  // Pipeline statistics
  app.get('/api/stats', requireAuth, async (_req, res) => {
    try {
      const [totalLeads, enrichedLeads, contactedLeads, totalContacts, totalJobs, activeJobs] =
        await Promise.all([
          prisma.lead.count(),
          prisma.lead.count({ where: { status: 'ENRICHED' } }),
          prisma.lead.count({ where: { status: 'CONTACTED' } }),
          prisma.contactPerson.count(),
          prisma.ingestionJob.count(),
          prisma.ingestionJob.count({ where: { status: 'RUNNING' } }),
        ]);

      // Unique industries
      const industryList = await prisma.lead.findMany({
        select: { industry: true },
        distinct: ['industry'],
        where: { industry: { not: null } },
      });

      // Unique states
      const stateList = await prisma.lead.findMany({
        select: { state: true },
        distinct: ['state'],
        where: { state: { not: null } },
      });

      // Email status aggregates
      const [validEmails, invalidEmails, riskyEmails] = await Promise.all([
        prisma.lead.count({ where: { email_status: 'VALID' } }),
        prisma.lead.count({ where: { email_status: 'INVALID' } }),
        prisma.lead.count({ where: { email_status: 'RISKY' } }),
      ]);

      // Score distribution: Tier 1 (75+), Tier 2 (50-74), Tier 3 (<50)
      const [highScoreLeads, avgScoreAgg] = await Promise.all([
        prisma.lead.count({ where: { score: { gte: 75 } } }),
        prisma.lead.aggregate({ _avg: { score: true } }),
      ]);

      res.json({
        totalLeads,
        enrichedLeads,
        contactedLeads,
        newLeads: totalLeads - enrichedLeads - contactedLeads,
        totalContacts,
        totalJobs,
        activeJobs,
        availableIndustries: industryList.map((i) => i.industry).filter(Boolean),
        availableStates: stateList.map((s) => s.state).filter(Boolean),
        emailStats: {
          valid: validEmails,
          invalid: invalidEmails,
          risky: riskyEmails,
          unknown: totalLeads - validEmails - invalidEmails - riskyEmails,
        },
        scoringStats: {
          highScoreLeads,
          averageScore: Math.round(avgScoreAgg._avg.score || 0),
        },
      });
    } catch (err: any) {
      console.error('[API /api/stats]', err);
      res.status(500).json({ error: 'Failed to retrieve stats' });
    }
  });

  // Start Ingestion Job
  app.post('/api/ingest', requireAuth, async (req, res) => {
    try {
      const { providerId, queryParams = {}, targetCount = 10, autoEnrich = false } = req.body;

      if (!providerId) {
        return res.status(400).json({ error: 'providerId is required' });
      }

      const jobId = await ingestionPipeline.startJob({
        providerId,
        queryParams,
        targetCount: Math.min(Math.max(Number(targetCount) || 10, 1), 100),
        autoEnrich: Boolean(autoEnrich),
      });

      const job = await prisma.ingestionJob.findUnique({
        where: { id: jobId },
      });

      res.status(202).json({
        message: 'Ingestion job queued and running',
        job,
      });
    } catch (err: any) {
      console.error('[API /api/ingest]', err);
      res.status(500).json({ error: err.message || 'Failed to start ingestion job' });
    }
  });

  // List Ingestion Jobs
  app.get('/api/jobs', requireAuth, async (_req, res) => {
    try {
      const jobs = await prisma.ingestionJob.findMany({
        orderBy: { created_at: 'desc' },
        take: 25,
      });
      res.json({ jobs });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  });

  // Single Job Status
  app.get('/api/jobs/:id', requireAuth, async (req, res) => {
    try {
      const job = await prisma.ingestionJob.findUnique({
        where: { id: req.params.id },
      });
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      res.json({ job });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch job' });
    }
  });

  // Query Leads (with search, filtering, pagination, sorting by score, email_status)
  app.get('/api/leads', requireAuth, async (req, res) => {
    try {
      const {
        search,
        state,
        industry,
        status,
        emailStatus,
        minScore,
        maxScore,
        provider,
        sortBy = 'score',
        sortOrder = 'desc',
        page = '1',
        limit = '15',
      } = req.query as Record<string, string>;

      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const take = Math.min(Math.max(parseInt(limit, 10) || 15, 1), 100);
      const skip = (pageNum - 1) * take;

      const where: any = {};

      if (state) {
        where.state = state;
      }

      if (industry) {
        where.industry = industry;
      }

      if (status) {
        where.status = status;
      }

      if (emailStatus) {
        where.email_status = emailStatus;
      }

      if (minScore || maxScore) {
        where.score = {};
        if (minScore) where.score.gte = parseInt(minScore, 10);
        if (maxScore) where.score.lte = parseInt(maxScore, 10);
      }

      if (provider) {
        where.source_provider = provider;
      }

      if (search && search.trim()) {
        const queryTerm = search.trim();
        where.OR = [
          { business_name: { contains: queryTerm } },
          { domain: { contains: queryTerm } },
          { phone: { contains: queryTerm } },
          { city: { contains: queryTerm } },
          { email: { contains: queryTerm } },
          { contacts: { some: { email: { contains: queryTerm } } } },
          { contacts: { some: { first_name: { contains: queryTerm } } } },
          { contacts: { some: { last_name: { contains: queryTerm } } } },
        ];
      }

      // Dynamic sorting (score, updated_at, business_name, etc.)
      const allowedSortFields = ['score', 'updated_at', 'business_name', 'created_at', 'employee_count'];
      const field = allowedSortFields.includes(sortBy) ? sortBy : 'score';
      const order = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

      const orderBy: any = [{ [field]: order }];
      if (field !== 'updated_at') {
        orderBy.push({ updated_at: 'desc' });
      }

      const [leads, totalCount] = await Promise.all([
        prisma.lead.findMany({
          where,
          include: {
            contacts: true,
          },
          orderBy,
          skip,
          take,
        }),
        prisma.lead.count({ where }),
      ]);

      res.json({
        leads,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: take,
          totalPages: Math.ceil(totalCount / take),
        },
        sorting: {
          sortBy: field,
          sortOrder: order,
        },
      });
    } catch (err: any) {
      console.error('[API /api/leads]', err);
      res.status(500).json({ error: 'Failed to fetch leads' });
    }
  });

  // Bulk update lead statuses
  app.patch('/api/leads/bulk/status', requireAuth, async (req, res) => {
    try {
      const { leadIds, status } = req.body;
      if (!Array.isArray(leadIds) || leadIds.length === 0) {
        return res.status(400).json({ error: 'leadIds must be a non-empty array of lead IDs' });
      }
      if (!['NEW', 'CONTACTED', 'ENRICHED'].includes(status)) {
        return res.status(400).json({ error: 'Status must be NEW, CONTACTED, or ENRICHED' });
      }

      await prisma.lead.updateMany({
        where: { id: { in: leadIds } },
        data: { status },
      });

      // Recalculate score for updated leads in parallel
      await Promise.all(
        leadIds.map((id) =>
          deduplicationEngine.recalculateLeadScoreAndEmail(id).catch((e) => {
            console.warn(`[Bulk Status] Score recalc failed for lead ${id}:`, e);
          })
        )
      );

      res.json({
        success: true,
        message: `Successfully updated ${leadIds.length} lead(s) to ${status}`,
        count: leadIds.length,
        leadIds,
        status,
      });
    } catch (err: any) {
      console.error('[API /api/leads/bulk/status]', err);
      res.status(500).json({ error: 'Failed to update leads in bulk' });
    }
  });

  // Bulk delete leads
  app.post('/api/leads/bulk/delete', requireAuth, async (req, res) => {
    try {
      const { leadIds } = req.body;
      if (!Array.isArray(leadIds) || leadIds.length === 0) {
        return res.status(400).json({ error: 'leadIds must be a non-empty array of lead IDs' });
      }

      await prisma.contactPerson.deleteMany({
        where: { lead_id: { in: leadIds } },
      });

      const result = await prisma.lead.deleteMany({
        where: { id: { in: leadIds } },
      });

      res.json({
        success: true,
        message: `Successfully deleted ${result.count} lead(s)`,
        count: result.count,
        leadIds,
      });
    } catch (err: any) {
      console.error('[API /api/leads/bulk/delete]', err);
      res.status(500).json({ error: 'Failed to delete leads in bulk' });
    }
  });

  // Also support DELETE /api/leads/bulk
  app.delete('/api/leads/bulk', requireAuth, async (req, res) => {
    try {
      const { leadIds } = req.body;
      if (!Array.isArray(leadIds) || leadIds.length === 0) {
        return res.status(400).json({ error: 'leadIds must be a non-empty array of lead IDs' });
      }

      await prisma.contactPerson.deleteMany({
        where: { lead_id: { in: leadIds } },
      });

      const result = await prisma.lead.deleteMany({
        where: { id: { in: leadIds } },
      });

      res.json({
        success: true,
        message: `Successfully deleted ${result.count} lead(s)`,
        count: result.count,
        leadIds,
      });
    } catch (err: any) {
      console.error('[API /api/leads/bulk]', err);
      res.status(500).json({ error: 'Failed to delete leads in bulk' });
    }
  });

  // Single Lead Details
  app.get('/api/leads/:id', requireAuth, async (req, res) => {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: req.params.id },
        include: { contacts: true },
      });
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }
      res.json({ lead });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch lead' });
    }
  });

  // Get Detailed Score Breakdown for a Lead
  app.get('/api/leads/:id/score-breakdown', requireAuth, async (req, res) => {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: req.params.id },
        include: { contacts: true },
      });
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      const breakdown = leadScorer.calculateScore({
        industry: lead.industry,
        employee_count: lead.employee_count,
        status: lead.status,
        email_status: lead.email_status,
        email: lead.email,
        domain: lead.domain,
        phone: lead.phone,
        contacts: lead.contacts.map((c) => ({
          title: c.title,
          email: c.email,
        })),
      });

      res.json({
        leadId: lead.id,
        businessName: lead.business_name,
        score: breakdown.total,
        grade: breakdown.grade,
        tierLabel: breakdown.tierLabel,
        factors: breakdown.factors,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to calculate score breakdown' });
    }
  });

  // Explicit Email Validation for a Lead
  app.post('/api/leads/:id/validate-email', requireAuth, async (req, res) => {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: req.params.id },
        include: { contacts: true },
      });

      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      const targetEmail = req.body.email || lead.email || (lead.contacts && lead.contacts[0]?.email);
      if (!targetEmail) {
        return res.status(400).json({ error: 'No email address found for this lead to validate' });
      }

      const validation = await emailValidationService.validateEmail(targetEmail);

      // Update lead email_status and recalculate score
      const updated = await prisma.lead.update({
        where: { id: lead.id },
        data: {
          email_status: validation.status,
          email: lead.email || targetEmail,
        },
        include: { contacts: true },
      });

      // Recalculate score with validated email status
      await deduplicationEngine.recalculateLeadScoreAndEmail(lead.id);

      const refreshed = await prisma.lead.findUnique({
        where: { id: lead.id },
        include: { contacts: true },
      });

      res.json({
        message: `Email validation completed: ${validation.status}`,
        validation,
        lead: refreshed,
      });
    } catch (err: any) {
      console.error('[API /api/leads/:id/validate-email]', err);
      res.status(500).json({ error: 'Failed to validate email' });
    }
  });

  // Single Lead Enrichment
  app.post('/api/leads/:id/enrich', requireAuth, async (req, res) => {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: req.params.id },
        include: { contacts: true },
      });

      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      // Use the appropriate provider or default to mock/b2b
      const providerId = lead.source_provider || 'b2b_contacts';
      let provider;
      try {
        provider = getProvider(providerId);
      } catch {
        provider = getProvider('b2b_contacts');
      }

      const enrichedRaw = await provider.enrich({
        businessName: lead.business_name,
        legalName: lead.legal_name || undefined,
        domain: lead.domain || undefined,
        website: lead.website || undefined,
        phone: lead.phone || undefined,
        email: lead.email || undefined,
        industry: lead.industry || undefined,
        employeeCount: lead.employee_count || undefined,
        revenueRange: lead.revenue_range || undefined,
        street: lead.street || undefined,
        city: lead.city || undefined,
        state: lead.state || undefined,
        zip: lead.zip || undefined,
        contacts: lead.contacts.map((c) => ({
          firstName: c.first_name,
          lastName: c.last_name,
          title: c.title || undefined,
          email: c.email || undefined,
          phone: c.phone || undefined,
          linkedinUrl: c.linkedin_url || undefined,
        })),
      });

      // Step in enrichment process: Validate each lead's email address
      const candidateEmail = enrichedRaw.email || (enrichedRaw.contacts && enrichedRaw.contacts[0]?.email);
      let emailStatusResult = lead.email_status;
      if (candidateEmail) {
        const validation = await emailValidationService.validateEmail(candidateEmail);
        emailStatusResult = validation.status;
      }

      // Save via deduplication engine to merge updates and recalculate scores
      await deduplicationEngine.upsertLead(enrichedRaw, provider.id);

      // Ensure email status is saved
      if (candidateEmail && emailStatusResult) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { email_status: emailStatusResult },
        });
      }

      await deduplicationEngine.recalculateLeadScoreAndEmail(lead.id);

      const updatedLead = await prisma.lead.findUnique({
        where: { id: lead.id },
        include: { contacts: true },
      });

      res.json({
        message: 'Lead successfully enriched and scored',
        lead: updatedLead,
      });
    } catch (err: any) {
      console.error('[API /api/leads/:id/enrich]', err);
      res.status(500).json({ error: err.message || 'Failed to enrich lead' });
    }
  });

  // Update Lead Status
  app.patch('/api/leads/:id/status', requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      if (!['NEW', 'CONTACTED', 'ENRICHED'].includes(status)) {
        return res.status(400).json({ error: 'Status must be NEW, CONTACTED, or ENRICHED' });
      }

      await prisma.lead.update({
        where: { id: req.params.id },
        data: { status },
      });

      // Recalculate score based on new engagement status
      await deduplicationEngine.recalculateLeadScoreAndEmail(req.params.id);

      const updated = await prisma.lead.findUnique({
        where: { id: req.params.id },
        include: { contacts: true },
      });

      res.json({ lead: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update lead status' });
    }
  });

  // Delete Lead
  app.delete('/api/leads/:id', requireAuth, async (req, res) => {
    try {
      await prisma.lead.delete({
        where: { id: req.params.id },
      });
      res.json({ success: true, id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete lead' });
    }
  });

  // Clear all leads (for quick reset/testing)
  app.delete('/api/leads', requireAuth, async (_req, res) => {
    try {
      await prisma.contactPerson.deleteMany({});
      await prisma.lead.deleteMany({});
      res.json({ success: true, message: 'All leads and contacts cleared' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to clear leads' });
    }
  });

  // Ingest initial verified enterprise B2B records from SEC EDGAR
  app.post('/api/seed', requireAuth, async (_req, res) => {
    try {
      const existing = await prisma.lead.count();
      if (existing > 0) {
        return res.json({ message: 'Database already has records', count: existing });
      }

      const secProvider = getProvider('sec_edgar');
      const batch = await secProvider.search({ limit: 10, industry: 'Software' });

      for (const lead of batch.leads) {
        await deduplicationEngine.upsertLead(lead, 'sec_edgar');
      }

      const count = await prisma.lead.count();
      res.json({ message: 'Ingested verified SEC EDGAR enterprise B2B leads successfully', count });
    } catch (err: any) {
      console.error('[API /api/seed]', err);
      res.status(500).json({ error: 'Failed to ingest initial enterprise leads' });
    }
  });

  // Export Filtered Leads to CSV
  app.get('/api/export/csv', requireAuth, async (req, res) => {
    try {
      const { search, state, industry, status, emailStatus, provider, sortBy = 'score', sortOrder = 'desc' } =
        req.query as Record<string, string>;
      const where: any = {};

      if (state) where.state = state;
      if (industry) where.industry = industry;
      if (status) where.status = status;
      if (emailStatus) where.email_status = emailStatus;
      if (provider) where.source_provider = provider;
      if (search && search.trim()) {
        const queryTerm = search.trim();
        where.OR = [
          { business_name: { contains: queryTerm } },
          { domain: { contains: queryTerm } },
          { phone: { contains: queryTerm } },
        ];
      }

      const allowedSortFields = ['score', 'updated_at', 'business_name', 'created_at'];
      const field = allowedSortFields.includes(sortBy) ? sortBy : 'score';
      const order = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

      const leads = await prisma.lead.findMany({
        where,
        include: { contacts: true },
        orderBy: [{ [field]: order }],
      });

      exportLeadsToCsv(leads, res);
    } catch (err: any) {
      console.error('[API /api/export/csv]', err);
      res.status(500).send('Failed to export CSV');
    }
  });

  // Serve PWA Web App Manifest with correct MIME type
  app.get(['/manifest.webmanifest', '/manifest.json'], (_req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.sendFile(path.resolve(process.cwd(), 'public', 'manifest.webmanifest'));
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Ensure default admin exists
  await ensureDefaultAdminUser();

  // One-time backfill of scores and email status for existing un-scored leads
  try {
    const unscoredLeads = await prisma.lead.findMany({
      where: {
        OR: [{ score: 0 }, { email_status: 'UNKNOWN' }],
      },
      include: { contacts: true },
      take: 50,
    });

    for (const l of unscoredLeads) {
      await deduplicationEngine.recalculateLeadScoreAndEmail(l.id);
    }
    if (unscoredLeads.length > 0) {
      console.log(`[Backfill] Initialized scores and email statuses for ${unscoredLeads.length} leads`);
    }
  } catch (backfillErr) {
    console.warn('[Backfill] Initial lead scoring check skipped:', backfillErr);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`B2B Lead Pipeline Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
