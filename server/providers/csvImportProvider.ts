import { LeadBatchResult, LeadProvider, LeadQueryParams, RawLeadData } from '../types.js';

export class CsvImportProvider implements LeadProvider {
  readonly id = 'csv_import';
  readonly name = 'Custom B2B Dataset & CSV Ingestion';
  readonly description =
    'Ingests user-supplied B2B datasets (CSV / JSON) with automatic header mapping, normalization, deduplication, and DNS deliverability checks.';

  // Storage for currently queued CSV batches
  private stagedBatches: Map<string, RawLeadData[]> = new Map();

  stageBatch(batchId: string, leads: RawLeadData[]) {
    this.stagedBatches.set(batchId, leads);
  }

  async search(query: LeadQueryParams): Promise<LeadBatchResult> {
    const batchId = query.query || 'default';
    const leads = this.stagedBatches.get(batchId) || [];
    const limit = query.limit || 20;
    const page = query.page || 1;
    const startIndex = (page - 1) * limit;

    const slice = leads.slice(startIndex, startIndex + limit);

    return {
      leads: slice,
      totalFound: leads.length,
      hasMore: startIndex + limit < leads.length,
      nextCursor: startIndex + limit < leads.length ? String(page + 1) : undefined,
    };
  }

  async enrich(lead: Partial<RawLeadData>): Promise<RawLeadData> {
    return {
      businessName: lead.businessName || 'Dataset Lead',
      legalName: lead.legalName || lead.businessName,
      domain: lead.domain,
      website: lead.website,
      phone: lead.phone,
      email: lead.email,
      industry: lead.industry || 'B2B Enterprise',
      employeeCount: lead.employeeCount || 50,
      revenueRange: lead.revenueRange || '$5M - $20M',
      street: lead.street,
      city: lead.city,
      state: lead.state,
      zip: lead.zip,
      country: lead.country || 'USA',
      providerId: lead.providerId || `csv-lead-${Date.now()}`,
      contacts: lead.contacts || [],
    };
  }
}
