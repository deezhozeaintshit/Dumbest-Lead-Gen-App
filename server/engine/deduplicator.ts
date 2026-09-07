import { prisma } from '../db.js';
import { RawLeadData } from '../types.js';
import { emailValidationService } from '../services/emailValidator.js';
import { leadScorer } from '../services/leadScorer.js';

export interface DeduplicationResult {
  action: 'CREATED' | 'UPDATED' | 'SKIPPED';
  leadId: string;
  matchedBy?: 'domain' | 'phone' | 'name_zip';
}

export function normalizeDomain(domain?: string): string | undefined {
  if (!domain) return undefined;
  try {
    let clean = domain.trim().toLowerCase();
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      clean = new URL(clean).hostname;
    }
    return clean.replace(/^www\./, '').replace(/\/.*$/, '');
  } catch {
    return domain.trim().toLowerCase().replace(/^www\./, '');
  }
}

export function normalizePhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  // Keep only alphanumeric/digits for loose comparison
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    // Return last 10 digits to normalize with/without country code (+1)
    return digits.slice(-10);
  }
  return phone.trim();
}

export function normalizeBusinessName(name?: string): string {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .replace(/(?:,\s*|\s+)(inc|llc|ltd|corp|corporation|co|group|partners|services)\.?$/i, '')
    .replace(/\s+/g, ' ');
}

export class DeduplicationEngine {
  /**
   * Deduplicates and upserts lead following the hierarchy:
   * 1. domain
   * 2. phone_number
   * 3. business_name + zip_code
   */
  async upsertLead(
    rawLead: RawLeadData,
    sourceProvider: string
  ): Promise<DeduplicationResult> {
    const cleanDomain = normalizeDomain(rawLead.domain || rawLead.website);
    const cleanPhone = normalizePhone(rawLead.phone);
    const cleanName = normalizeBusinessName(rawLead.businessName);
    const cleanZip = rawLead.zip?.trim();

    let existingLead = null;
    let matchedBy: 'domain' | 'phone' | 'name_zip' | undefined = undefined;

    // Hierarchy 1: Domain match
    if (cleanDomain) {
      existingLead = await prisma.lead.findFirst({
        where: {
          domain: cleanDomain,
        },
        include: {
          contacts: true,
        },
      });
      if (existingLead) matchedBy = 'domain';
    }

    // Hierarchy 2: Phone match (if not matched by domain)
    if (!existingLead && cleanPhone && cleanPhone.length >= 10) {
      // Find candidate leads and compare digits
      const phoneCandidates = await prisma.lead.findMany({
        where: {
          phone: { not: null },
        },
        include: {
          contacts: true,
        },
        take: 100,
      });

      for (const candidate of phoneCandidates) {
        if (candidate.phone && normalizePhone(candidate.phone) === cleanPhone) {
          existingLead = candidate;
          matchedBy = 'phone';
          break;
        }
      }
    }

    // Hierarchy 3: business_name + zip_code match
    if (!existingLead && cleanName && cleanZip) {
      const nameCandidates = await prisma.lead.findMany({
        where: {
          zip: cleanZip,
        },
        include: {
          contacts: true,
        },
      });

      for (const candidate of nameCandidates) {
        if (normalizeBusinessName(candidate.business_name) === cleanName) {
          existingLead = candidate;
          matchedBy = 'name_zip';
          break;
        }
      }
    }

    // UPDATE existing record with enriched or newer fields
    if (existingLead) {
      const updateData: any = {};

      if (!existingLead.legal_name && rawLead.legalName) updateData.legal_name = rawLead.legalName;
      if (!existingLead.domain && cleanDomain) updateData.domain = cleanDomain;
      if (!existingLead.website && rawLead.website) updateData.website = rawLead.website;
      if (!existingLead.phone && rawLead.phone) updateData.phone = rawLead.phone;
      if (!existingLead.email && rawLead.email) updateData.email = rawLead.email;
      if (!existingLead.industry && rawLead.industry) updateData.industry = rawLead.industry;
      if (!existingLead.employee_count && rawLead.employeeCount) updateData.employee_count = rawLead.employeeCount;
      if (!existingLead.revenue_range && rawLead.revenueRange) updateData.revenue_range = rawLead.revenueRange;
      if (!existingLead.street && rawLead.street) updateData.street = rawLead.street;
      if (!existingLead.city && rawLead.city) updateData.city = rawLead.city;
      if (!existingLead.state && rawLead.state) updateData.state = rawLead.state;
      if (!existingLead.zip && rawLead.zip) updateData.zip = rawLead.zip;

      // If existing was marked NEW and now has rich data or contacts, update status
      if (existingLead.status === 'NEW' && rawLead.contacts && rawLead.contacts.length > 0) {
        updateData.status = 'ENRICHED';
      }

      // Email validation step
      const effectiveEmail = rawLead.email || existingLead.email || (rawLead.contacts && rawLead.contacts[0]?.email);
      if (effectiveEmail) {
        const emailValidation = await emailValidationService.validateEmail(effectiveEmail);
        updateData.email_status = emailValidation.status;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.lead.update({
          where: { id: existingLead.id },
          data: updateData,
        });
      }

      // Upsert new contacts without duplicate email or name
      if (rawLead.contacts && rawLead.contacts.length > 0) {
        const existingEmails = new Set(
          existingLead.contacts.map((c) => c.email?.toLowerCase()).filter(Boolean)
        );
        const existingNames = new Set(
          existingLead.contacts.map((c) => `${c.first_name.toLowerCase()}_${c.last_name.toLowerCase()}`)
        );

        for (const contact of rawLead.contacts) {
          const contactEmail = contact.email?.toLowerCase();
          const contactKey = `${contact.firstName.toLowerCase()}_${contact.lastName.toLowerCase()}`;

          if ((contactEmail && existingEmails.has(contactEmail)) || existingNames.has(contactKey)) {
            continue; // Skip duplicate contact person
          }

          await prisma.contactPerson.create({
            data: {
              lead_id: existingLead.id,
              first_name: contact.firstName,
              last_name: contact.lastName,
              title: contact.title,
              email: contact.email,
              phone: contact.phone,
              linkedin_url: contact.linkedinUrl,
            },
          });
        }
      }

      // Recalculate score with full merged contacts and attributes
      await this.recalculateLeadScoreAndEmail(existingLead.id);

      return {
        action: 'UPDATED',
        leadId: existingLead.id,
        matchedBy,
      };
    }

    // Email validation for new lead
    const emailToValidate = rawLead.email || (rawLead.contacts && rawLead.contacts[0]?.email);
    let initialEmailStatus = 'UNKNOWN';
    if (emailToValidate) {
      const emailResult = await emailValidationService.validateEmail(emailToValidate);
      initialEmailStatus = emailResult.status;
    }

    // Initial scoring for new lead
    const initialStatus = rawLead.contacts && rawLead.contacts.length > 0 ? 'ENRICHED' : 'NEW';
    const scoreResult = leadScorer.calculateScore({
      industry: rawLead.industry,
      employee_count: rawLead.employeeCount,
      status: initialStatus,
      email_status: initialEmailStatus,
      email: rawLead.email,
      domain: cleanDomain,
      phone: rawLead.phone,
      contacts: (rawLead.contacts || []).map((c) => ({
        title: c.title,
        email: c.email,
      })),
    });

    // CREATE new lead
    const createdLead = await prisma.lead.create({
      data: {
        business_name: rawLead.businessName,
        legal_name: rawLead.legalName,
        domain: cleanDomain,
        website: rawLead.website,
        phone: rawLead.phone,
        email: rawLead.email,
        industry: rawLead.industry,
        employee_count: rawLead.employeeCount,
        revenue_range: rawLead.revenueRange,
        street: rawLead.street,
        city: rawLead.city,
        state: rawLead.state,
        zip: rawLead.zip,
        country: rawLead.country || 'USA',
        source_provider: sourceProvider,
        provider_id: rawLead.providerId,
        status: initialStatus,
        score: scoreResult.total,
        email_status: initialEmailStatus,
        contacts: {
          create: (rawLead.contacts || []).map((c) => ({
            first_name: c.firstName,
            last_name: c.lastName,
            title: c.title,
            email: c.email,
            phone: c.phone,
            linkedin_url: c.linkedinUrl,
          })),
        },
      },
    });

    return {
      action: 'CREATED',
      leadId: createdLead.id,
    };
  }

  /**
   * Recalculates score and email status for an existing lead
   */
  async recalculateLeadScoreAndEmail(leadId: string): Promise<void> {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { contacts: true },
    });
    if (!lead) return;

    let emailStatus = lead.email_status;
    const targetEmail = lead.email || (lead.contacts && lead.contacts[0]?.email);

    if (targetEmail && (emailStatus === 'UNKNOWN' || !emailStatus)) {
      const emailValidation = await emailValidationService.validateEmail(targetEmail);
      emailStatus = emailValidation.status;
    }

    const scoreResult = leadScorer.calculateScore({
      industry: lead.industry,
      employee_count: lead.employee_count,
      status: lead.status,
      email_status: emailStatus,
      email: lead.email,
      domain: lead.domain,
      phone: lead.phone,
      contacts: lead.contacts.map((c) => ({
        title: c.title,
        email: c.email,
      })),
    });

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        score: scoreResult.total,
        email_status: emailStatus,
      },
    });
  }
}

export const deduplicationEngine = new DeduplicationEngine();
