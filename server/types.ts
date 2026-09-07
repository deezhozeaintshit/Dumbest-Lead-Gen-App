export interface LeadQueryParams {
  query?: string;
  industry?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  companySize?: string;
  limit?: number;
  page?: number;
  cursor?: string;
}

export interface RawContactPerson {
  firstName: string;
  lastName: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
}

export interface RawLeadData {
  businessName: string;
  legalName?: string;
  domain?: string;
  website?: string;
  phone?: string;
  email?: string;
  industry?: string;
  employeeCount?: number;
  revenueRange?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  providerId?: string;
  contacts?: RawContactPerson[];
}

export interface LeadBatchResult {
  leads: RawLeadData[];
  totalFound: number;
  nextCursor?: string;
  hasMore: boolean;
}

export interface LeadProvider {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  search(query: LeadQueryParams): Promise<LeadBatchResult>;
  enrich(lead: Partial<RawLeadData>): Promise<RawLeadData>;
}

export interface IngestionJobConfig {
  providerId: string;
  queryParams: LeadQueryParams;
  targetCount: number;
  autoEnrich?: boolean;
}

export interface PipelineProgressCallback {
  (progress: {
    jobId: string;
    totalFound: number;
    totalImported: number;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    message?: string;
  }): void;
}
