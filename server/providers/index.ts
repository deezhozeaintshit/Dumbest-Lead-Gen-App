import { LeadProvider } from '../types.js';
import { B2BContactProvider } from './b2bContactProvider.js';
import { GooglePlacesProvider } from './googlePlacesProvider.js';
import { MockLeadProvider } from './mockProvider.js';

export const providers: Record<string, LeadProvider> = {
  mock: new MockLeadProvider(),
  google_places: new GooglePlacesProvider(),
  b2b_contacts: new B2BContactProvider(),
};

export function getProvider(providerId: string): LeadProvider {
  const provider = providers[providerId];
  if (!provider) {
    throw new Error(`Unknown provider: "${providerId}". Available: ${Object.keys(providers).join(', ')}`);
  }
  return provider;
}

export function listProviders() {
  return Object.values(providers).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    isMock: p.id === 'mock',
    hasKey:
      p.id === 'mock'
        ? true
        : p.id === 'google_places'
        ? Boolean(process.env.GOOGLE_PLACES_API_KEY)
        : Boolean(process.env.APOLLO_API_KEY || process.env.HUNTER_API_KEY),
  }));
}
