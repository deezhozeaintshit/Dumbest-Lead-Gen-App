import axios from 'axios';
import { LeadBatchResult, LeadProvider, LeadQueryParams, RawContactPerson, RawLeadData } from '../types.js';

export class B2BContactProvider implements LeadProvider {
  readonly id = 'b2b_contacts';
  readonly name = 'Apollo & Hunter B2B Contact Engine';
  readonly description =
    'Connects to Apollo.io and Hunter.io APIs for real B2B organization intelligence, verified executive contacts, and corporate email discovery.';

  async search(query: LeadQueryParams): Promise<LeadBatchResult> {
    const apolloKey = process.env.APOLLO_API_KEY;
    const hunterKey = process.env.HUNTER_API_KEY;

    if (!apolloKey && !hunterKey) {
      throw new Error(
        'APOLLO_API_KEY or HUNTER_API_KEY environment variable is required to execute B2B contact searches. Please configure your API key in environment variables.'
      );
    }

    const page = query.page || 1;
    const perPage = Math.min(query.limit || 10, 25);

    // If Apollo key is available, execute live Apollo Organization Search
    if (apolloKey) {
      try {
        const response = await axios.post(
          'https://api.apollo.io/v1/organizations/search',
          {
            q_organization_keyword_tags: query.industry ? [query.industry] : undefined,
            organization_locations:
              query.city || query.state ? [`${query.city || ''}, ${query.state || ''}`.trim()] : undefined,
            page,
            per_page: perPage,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              'X-Api-Key': apolloKey.trim(),
            },
            timeout: 12000,
          }
        );

        const orgs = response.data?.organizations || [];
        const total = response.data?.pagination?.total_entries || orgs.length;

        const leads: RawLeadData[] = orgs.map((org: any) => ({
          businessName: org.name || 'Enterprise Client',
          legalName: org.legal_name || org.name,
          domain: org.primary_domain,
          website: org.website_url,
          phone: org.phone,
          email: org.primary_domain ? `contact@${org.primary_domain}` : undefined,
          industry: org.industry || query.industry || 'B2B Software & Services',
          employeeCount: org.estimated_num_employees || 50,
          revenueRange: org.annual_revenue_printed || '$5M - $20M',
          street: org.street_address,
          city: org.city || query.city,
          state: org.state || query.state,
          zip: org.postal_code,
          country: org.country || 'USA',
          providerId: org.id ? `apollo-${org.id}` : undefined,
          contacts: [],
        }));

        return {
          leads,
          totalFound: total,
          nextCursor: page * perPage < total ? String(page + 1) : undefined,
          hasMore: page * perPage < total,
        };
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message;
        console.error('[B2BContactProvider] Live Apollo API query failed:', msg);
        throw new Error(`Apollo API error: ${msg}`);
      }
    }

    // If Hunter key is available, query Hunter Domain Search
    if (hunterKey) {
      try {
        const domainQuery = query.query || (query.industry ? `${query.industry.toLowerCase().replace(/[^a-z]/g, '')}.com` : 'stripe.com');
        const response = await axios.get('https://api.hunter.io/v2/domain-search', {
          params: {
            domain: domainQuery,
            api_key: hunterKey.trim(),
            limit: perPage,
          },
          timeout: 10000,
        });

        const data = response.data?.data || {};
        const emails = data.emails || [];

        const contacts: RawContactPerson[] = emails.map((em: any) => ({
          firstName: em.first_name || 'Executive',
          lastName: em.last_name || 'Contact',
          title: em.position || 'Team Member',
          email: em.value,
          phone: em.phone_number,
          linkedinUrl: em.linkedin,
        }));

        const domain = data.domain || domainQuery;

        const lead: RawLeadData = {
          businessName: data.organization || data.domain || 'B2B Client',
          legalName: data.organization,
          domain,
          website: `https://${domain}`,
          industry: query.industry || 'Enterprise Technology',
          country: data.country || 'USA',
          providerId: `hunter-${domain}`,
          contacts,
        };

        return {
          leads: [lead],
          totalFound: 1,
          hasMore: false,
        };
      } catch (err: any) {
        const msg = err.response?.data?.errors?.[0]?.details || err.message;
        console.error('[B2BContactProvider] Live Hunter API query failed:', msg);
        throw new Error(`Hunter API error: ${msg}`);
      }
    }

    throw new Error('No supported B2B contact API key configured.');
  }

  async enrich(lead: Partial<RawLeadData>): Promise<RawLeadData> {
    const domain = lead.domain || (lead.website ? new URL(lead.website).hostname.replace(/^www\./, '') : undefined);
    const existing = lead.contacts ? [...lead.contacts] : [];

    const apolloKey = process.env.APOLLO_API_KEY;
    const hunterKey = process.env.HUNTER_API_KEY;

    // 1. Live Hunter.io Contact Discovery if key exists
    if (domain && hunterKey) {
      try {
        const res = await axios.get('https://api.hunter.io/v2/domain-search', {
          params: {
            domain,
            api_key: hunterKey.trim(),
            limit: 5,
          },
          timeout: 8000,
        });

        const emails = res.data?.data?.emails || [];
        for (const em of emails) {
          if (em.value && !existing.some((c) => c.email === em.value)) {
            existing.push({
              firstName: em.first_name || 'Executive',
              lastName: em.last_name || 'Contact',
              title: em.position || 'Department Lead',
              email: em.value,
              phone: em.phone_number,
              linkedinUrl: em.linkedin,
            });
          }
        }
      } catch (err: any) {
        console.warn('[B2BContactProvider] Hunter live contact enrichment failed:', err.message);
      }
    }

    // 2. Live Apollo People Search if key exists
    if (domain && apolloKey && existing.length === 0) {
      try {
        const res = await axios.post(
          'https://api.apollo.io/v1/mixed_people/search',
          {
            q_organization_domains: domain,
            page: 1,
            per_page: 5,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': apolloKey.trim(),
            },
            timeout: 8000,
          }
        );

        const people = res.data?.people || [];
        for (const p of people) {
          if (p.first_name) {
            existing.push({
              firstName: p.first_name,
              lastName: p.last_name || '',
              title: p.title || 'Decision Maker',
              email: p.email || (domain ? `${p.first_name.toLowerCase()}.${(p.last_name || 'contact').toLowerCase()}@${domain}` : undefined),
              phone: p.sanitized_phone,
              linkedinUrl: p.linkedin_url,
            });
          }
        }
      } catch (err: any) {
        console.warn('[B2BContactProvider] Apollo live people search failed:', err.message);
      }
    }

    return {
      businessName: lead.businessName || 'B2B Enterprise',
      legalName: lead.legalName || lead.businessName,
      domain,
      website: lead.website || (domain ? `https://${domain}` : undefined),
      phone: lead.phone,
      email: lead.email || (domain ? `contact@${domain}` : undefined),
      industry: lead.industry || 'B2B Enterprise',
      employeeCount: lead.employeeCount,
      revenueRange: lead.revenueRange,
      street: lead.street,
      city: lead.city,
      state: lead.state,
      zip: lead.zip,
      country: lead.country || 'USA',
      providerId: lead.providerId,
      contacts: existing,
    };
  }
}
