import { Response } from 'express';

export interface ExportLeadRow {
  id: string;
  business_name: string;
  legal_name?: string | null;
  domain?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  industry?: string | null;
  employee_count?: number | null;
  revenue_range?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  source_provider: string;
  status: string;
  score?: number | null;
  email_status?: string | null;
  created_at: Date;
  contacts?: Array<{
    first_name: string;
    last_name: string;
    title?: string | null;
    email?: string | null;
    phone?: string | null;
    linkedin_url?: string | null;
  }>;
}

function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export function exportLeadsToCsv(leads: ExportLeadRow[], res: Response, filename?: string): void {
  const exportFilename = filename || `b2b_leads_export_${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${exportFilename}"`);

  const headers = [
    'Lead ID',
    'Business Name',
    'Legal Name',
    'Domain',
    'Website',
    'Phone',
    'Email',
    'Industry',
    'Employees',
    'Revenue Range',
    'Street',
    'City',
    'State',
    'ZIP Code',
    'Country',
    'Source Provider',
    'Status',
    'Lead Score',
    'Email Status',
    'Created Date',
    'Primary Contact Name',
    'Primary Contact Title',
    'Primary Contact Email',
    'Primary Contact LinkedIn',
    'Total Contacts',
  ];

  // Write header
  res.write(headers.join(',') + '\r\n');

  for (const lead of leads) {
    const primaryContact = lead.contacts?.[0];
    const contactName = primaryContact ? `${primaryContact.first_name} ${primaryContact.last_name}` : '';

    const row = [
      escapeCsvField(lead.id),
      escapeCsvField(lead.business_name),
      escapeCsvField(lead.legal_name || ''),
      escapeCsvField(lead.domain || ''),
      escapeCsvField(lead.website || ''),
      escapeCsvField(lead.phone || ''),
      escapeCsvField(lead.email || ''),
      escapeCsvField(lead.industry || ''),
      escapeCsvField(lead.employee_count ?? ''),
      escapeCsvField(lead.revenue_range || ''),
      escapeCsvField(lead.street || ''),
      escapeCsvField(lead.city || ''),
      escapeCsvField(lead.state || ''),
      escapeCsvField(lead.zip || ''),
      escapeCsvField(lead.country || 'USA'),
      escapeCsvField(lead.source_provider),
      escapeCsvField(lead.status),
      escapeCsvField(lead.score ?? 0),
      escapeCsvField(lead.email_status || 'UNKNOWN'),
      escapeCsvField(new Date(lead.created_at).toLocaleDateString()),
      escapeCsvField(contactName),
      escapeCsvField(primaryContact?.title || ''),
      escapeCsvField(primaryContact?.email || ''),
      escapeCsvField(primaryContact?.linkedin_url || ''),
      escapeCsvField(lead.contacts?.length || 0),
    ];

    res.write(row.join(',') + '\r\n');
  }

  res.end();
}
