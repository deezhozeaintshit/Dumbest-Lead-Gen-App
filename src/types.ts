export interface ContactPerson {
  id: string;
  lead_id: string;
  first_name: string;
  last_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  created_at: string;
}

export type EmailStatus = 'VALID' | 'INVALID' | 'RISKY' | 'UNKNOWN';

export interface Lead {
  id: string;
  business_name: string;
  legal_name: string | null;
  domain: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  industry: string | null;
  employee_count: number | null;
  revenue_range: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  source_provider: string;
  provider_id: string | null;
  status: 'NEW' | 'CONTACTED' | 'ENRICHED';
  score: number;
  email_status: EmailStatus;
  created_at: string;
  updated_at: string;
  contacts: ContactPerson[];
}

export interface IngestionJob {
  id: string;
  provider: string;
  query_params: string;
  total_found: number;
  total_imported: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineStats {
  totalLeads: number;
  enrichedLeads: number;
  contactedLeads: number;
  newLeads: number;
  totalContacts: number;
  totalJobs: number;
  activeJobs: number;
  availableIndustries: string[];
  availableStates: string[];
  emailStats?: {
    valid: number;
    invalid: number;
    risky: number;
    unknown: number;
  };
  scoringStats?: {
    highScoreLeads: number;
    averageScore: number;
  };
}

export interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  isMock: boolean;
  requiresKey?: boolean;
  keyEnvVar?: string;
  hasKey: boolean;
  isDeferred?: boolean;
  statusNote?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: string;
}

export interface ScoreFactor {
  category: 'industry' | 'company_size' | 'job_title' | 'engagement' | 'email_validity';
  label: string;
  points: number;
  maxPoints: number;
  description: string;
}

export interface ScoreBreakdown {
  leadId: string;
  businessName: string;
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  tierLabel: string;
  factors: ScoreFactor[];
}
