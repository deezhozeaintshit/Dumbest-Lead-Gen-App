import { LeadBatchResult, LeadProvider, LeadQueryParams, RawLeadData } from '../types.js';

const INDUSTRIES = [
  'Software & SaaS',
  'Healthcare & Biotechnology',
  'Industrial Manufacturing',
  'Financial Services & Fintech',
  'Commercial Real Estate',
  'Supply Chain & Logistics',
  'CleanTech & Renewable Energy',
  'Professional Consulting',
];

const CITIES = [
  { city: 'Austin', state: 'TX', zip: '78701' },
  { city: 'San Francisco', state: 'CA', zip: '94105' },
  { city: 'New York', state: 'NY', zip: '10001' },
  { city: 'Chicago', state: 'IL', zip: '60601' },
  { city: 'Seattle', state: 'WA', zip: '98101' },
  { city: 'Boston', state: 'MA', zip: '02110' },
  { city: 'Denver', state: 'CO', zip: '80202' },
  { city: 'Atlanta', state: 'GA', zip: '30303' },
];

const COMPANY_PREFIXES = [
  'Apex', 'Vanguard', 'Nexus', 'Cascade', 'Summit', 'Meridian', 'Cobalt',
  'Starlight', 'Beacon', 'Horizon', 'Elevate', 'Aegis', 'Quantum', 'Synthetix',
  'IronClad', 'Crestview', 'AlphaWave', 'OmniCore', 'ClearPath', 'Vector'
];

const COMPANY_SUFFIXES = [
  'Technologies', 'Solutions', 'Holdings', 'Logistics', 'Analytics',
  'Systems', 'Enterprises', 'Ventures', 'Labs', 'Dynamics', 'Partners'
];

const EXECUTIVE_ROLES = [
  { title: 'Chief Executive Officer', prefix: 'CEO' },
  { title: 'Chief Technology Officer', prefix: 'CTO' },
  { title: 'VP of Business Development', prefix: 'VP-BD' },
  { title: 'Head of Growth & Operations', prefix: 'H-Ops' },
  { title: 'Director of Procurement', prefix: 'Dir-Proc' },
  { title: 'Chief Operating Officer', prefix: 'COO' },
];

const FIRST_NAMES = [
  'Elena', 'Marcus', 'Sophia', 'Julian', 'Priya', 'David', 'Chloe',
  'Alexander', 'Amara', 'Liam', 'Sarah', 'Nathan', 'Maya', 'Gabriel'
];

const LAST_NAMES = [
  'Vance', 'Chen', 'Sterling', 'O\'Connor', 'Patel', 'Kowalski', 'Reynolds',
  'Sinclair', 'Rodriguez', 'Blackwood', 'Gallagher', 'Novak', 'Kim', 'Hayes'
];

export class MockLeadProvider implements LeadProvider {
  readonly id = 'mock';
  readonly name = 'Mock B2B Sandbox Engine';
  readonly description = 'High-fidelity mock provider with realistic pagination, company profiles, and verified executive contacts.';

  async search(query: LeadQueryParams): Promise<LeadBatchResult> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const limit = query.limit || 10;
    const page = query.page || 1;
    const targetIndustry = query.industry?.trim() || 'Software & SaaS';
    const locationCity = query.city?.trim();
    const locationState = query.state?.trim();

    // Deterministic generation seeded by industry and page
    const totalFound = 65; // Total simulated records
    const startIndex = (page - 1) * limit;

    if (startIndex >= totalFound) {
      return {
        leads: [],
        totalFound,
        hasMore: false,
      };
    }

    const leads: RawLeadData[] = [];
    const countToGenerate = Math.min(limit, totalFound - startIndex);

    for (let i = 0; i < countToGenerate; i++) {
      const idx = startIndex + i;
      const prefix = COMPANY_PREFIXES[idx % COMPANY_PREFIXES.length];
      const suffix = COMPANY_SUFFIXES[(idx * 3) % COMPANY_SUFFIXES.length];
      const businessName = `${prefix} ${suffix}`;
      const slug = `${prefix.toLowerCase()}${suffix.toLowerCase()}`;
      const domain = `${slug}.io`;
      
      const loc = (locationCity && locationState)
        ? { city: locationCity, state: locationState, zip: query.zip || '78701' }
        : CITIES[idx % CITIES.length];

      const phoneAreaCode = loc.state === 'TX' ? '512' : loc.state === 'CA' ? '415' : loc.state === 'NY' ? '212' : '312';
      const phoneNum = `${phoneAreaCode}-${200 + (idx * 7) % 800}-${1000 + (idx * 13) % 9000}`;

      const empCount = 20 + ((idx * 37) % 850);
      let revenue = '$1M - $5M';
      if (empCount > 500) revenue = '$50M - $100M';
      else if (empCount > 150) revenue = '$15M - $50M';
      else if (empCount > 50) revenue = '$5M - $15M';

      const firstName = FIRST_NAMES[idx % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(idx * 2) % LAST_NAMES.length];
      const exec = EXECUTIVE_ROLES[idx % EXECUTIVE_ROLES.length];

      leads.push({
        businessName,
        legalName: `${businessName}, LLC`,
        domain,
        website: `https://${domain}`,
        phone: phoneNum,
        email: `contact@${domain}`,
        industry: targetIndustry || INDUSTRIES[idx % INDUSTRIES.length],
        employeeCount: empCount,
        revenueRange: revenue,
        street: `${100 + (idx * 14)} Enterprise Way`,
        city: loc.city,
        state: loc.state,
        zip: loc.zip,
        country: 'USA',
        providerId: `mock-lead-${idx + 1000}`,
        contacts: [
          {
            firstName,
            lastName,
            title: exec.title,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
            phone: phoneNum,
            linkedinUrl: `https://www.linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${idx + 10}`,
          },
        ],
      });
    }

    const hasMore = startIndex + countToGenerate < totalFound;

    return {
      leads,
      totalFound,
      nextCursor: hasMore ? String(page + 1) : undefined,
      hasMore,
    };
  }

  async enrich(lead: Partial<RawLeadData>): Promise<RawLeadData> {
    await new Promise((resolve) => setTimeout(resolve, 250));

    const domain = lead.domain || (lead.website ? new URL(lead.website).hostname.replace(/^www\./, '') : 'enterprise.io');
    const existingContacts = lead.contacts || [];

    // Add additional executive decision-makers
    const secondExec = EXECUTIVE_ROLES[(existingContacts.length + 2) % EXECUTIVE_ROLES.length];
    const fName = FIRST_NAMES[(existingContacts.length + 5) % FIRST_NAMES.length];
    const lName = LAST_NAMES[(existingContacts.length + 3) % LAST_NAMES.length];

    const enrichedContacts = [
      ...existingContacts,
      {
        firstName: fName,
        lastName: lName,
        title: secondExec.title,
        email: `${fName.toLowerCase()}.${lName.toLowerCase()}@${domain}`,
        phone: lead.phone || '512-555-0199',
        linkedinUrl: `https://www.linkedin.com/in/${fName.toLowerCase()}-${lName.toLowerCase()}-verified`,
      },
    ];

    return {
      businessName: lead.businessName || 'Verified Enterprise',
      legalName: lead.legalName || `${lead.businessName} Corporation`,
      domain,
      website: lead.website || `https://${domain}`,
      phone: lead.phone || '800-555-0100',
      email: lead.email || `sales@${domain}`,
      industry: lead.industry || 'Technology & Services',
      employeeCount: lead.employeeCount || 85,
      revenueRange: lead.revenueRange || '$10M - $25M',
      street: lead.street || '450 Innovation Parkway, Suite 300',
      city: lead.city || 'Austin',
      state: lead.state || 'TX',
      zip: lead.zip || '78701',
      country: lead.country || 'USA',
      providerId: lead.providerId || `mock-enriched-${Date.now()}`,
      contacts: enrichedContacts,
    };
  }
}
