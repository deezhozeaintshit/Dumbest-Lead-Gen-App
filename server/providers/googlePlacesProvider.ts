import axios from 'axios';
import { LeadBatchResult, LeadProvider, LeadQueryParams, RawLeadData } from '../types.js';

export class GooglePlacesProvider implements LeadProvider {
  readonly id = 'google_places';
  readonly name = 'Google Places API (Local Business)';
  readonly description =
    'Queries Google Places API (New) for verified local businesses, phone numbers, addresses, and official websites.';

  async search(query: LeadQueryParams): Promise<LeadBatchResult> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'Google Places API is optional and currently deferred pending bank verification. The application is fully operational with live SEC EDGAR and OpenStreetMap Commercial Directory feeds.'
      );
    }

    const searchTerm = [query.query, query.industry, query.city, query.state].filter(Boolean).join(' ');
    const pageSize = Math.min(query.limit || 10, 20);

    try {
      const response = await axios.post(
        'https://places.googleapis.com/v1/places:searchText',
        {
          textQuery: searchTerm || 'local businesses',
          pageSize,
          pageToken: query.cursor || undefined,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey.trim(),
            'X-Goog-FieldMask':
              'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.addressComponents,places.primaryTypeDisplayName,nextPageToken',
          },
          timeout: 10000,
        }
      );

      const places = response.data?.places || [];
      const nextPageToken = response.data?.nextPageToken;

      const leads: RawLeadData[] = places.map((place: any) => {
        const businessName = place.displayName?.text || 'Local Business';
        let website = place.websiteUri || undefined;
        let domain: string | undefined;

        if (website) {
          try {
            domain = new URL(website).hostname.replace(/^www\./, '');
          } catch {
            // invalid URL format
          }
        }

        // Parse address components
        let city = query.city;
        let state = query.state;
        let zip = query.zip;
        let street: string | undefined;

        if (Array.isArray(place.addressComponents)) {
          for (const comp of place.addressComponents) {
            const types = comp.types || [];
            if (types.includes('locality')) city = comp.longText || comp.shortText;
            if (types.includes('administrative_area_level_1')) state = comp.shortText;
            if (types.includes('postal_code')) zip = comp.shortText;
            if (types.includes('route')) street = comp.longText;
          }
        }

        return {
          businessName,
          legalName: businessName,
          domain,
          website,
          phone: place.nationalPhoneNumber,
          email: domain ? `info@${domain}` : undefined,
          industry: place.primaryTypeDisplayName?.text || query.industry || 'Local Business',
          street: street || place.formattedAddress?.split(',')[0],
          city: city || 'Austin',
          state: state || 'TX',
          zip,
          country: 'USA',
          providerId: place.id,
          contacts: [],
        };
      });

      return {
        leads,
        totalFound: leads.length + (nextPageToken ? 20 : 0),
        nextCursor: nextPageToken,
        hasMore: Boolean(nextPageToken),
      };
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message;
      console.error('[GooglePlacesProvider] Live API query failed:', msg);
      throw new Error(`Google Places API error: ${msg}`);
    }
  }

  async enrich(lead: Partial<RawLeadData>): Promise<RawLeadData> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      return {
        businessName: lead.businessName || 'Business Lead',
        legalName: lead.legalName || lead.businessName,
        domain: lead.domain,
        website: lead.website,
        phone: lead.phone,
        email: lead.email,
        industry: lead.industry || 'Local Business',
        street: lead.street,
        city: lead.city,
        state: lead.state,
        zip: lead.zip,
        country: lead.country || 'USA',
        providerId: lead.providerId || `place-enriched-${Date.now()}`,
        contacts: lead.contacts || [],
      };
    }

    if (lead.providerId && lead.providerId.startsWith('places/')) {
      try {
        const placeId = lead.providerId.replace(/^places\//, '');
        const detailRes = await axios.get(`https://places.googleapis.com/v1/places/${placeId}`, {
          headers: {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'id,displayName,nationalPhoneNumber,websiteUri,formattedAddress',
          },
          timeout: 8000,
        });

        const p = detailRes.data;
        return {
          businessName: p.displayName?.text || lead.businessName || 'Business',
          legalName: lead.legalName || p.displayName?.text,
          domain: lead.domain,
          website: p.websiteUri || lead.website,
          phone: p.nationalPhoneNumber || lead.phone,
          email: lead.email,
          industry: lead.industry || 'Local Business',
          street: lead.street || p.formattedAddress?.split(',')[0],
          city: lead.city,
          state: lead.state,
          zip: lead.zip,
          country: lead.country || 'USA',
          providerId: lead.providerId,
          contacts: lead.contacts || [],
        };
      } catch (err: any) {
        console.warn('[GooglePlacesProvider] Place detail enrichment failed:', err.message);
      }
    }

    return {
      businessName: lead.businessName || 'Business',
      legalName: lead.legalName || lead.businessName,
      domain: lead.domain,
      website: lead.website,
      phone: lead.phone,
      email: lead.email,
      industry: lead.industry,
      street: lead.street,
      city: lead.city,
      state: lead.state,
      zip: lead.zip,
      country: lead.country || 'USA',
      providerId: lead.providerId,
      contacts: lead.contacts || [],
    };
  }
}
