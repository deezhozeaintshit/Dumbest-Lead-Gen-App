import { LeadProvider } from '../types.js';
import { B2BContactProvider } from './b2bContactProvider.js';
import { CsvImportProvider } from './csvImportProvider.js';
import { GooglePlacesProvider } from './googlePlacesProvider.js';
import { OsmCommercialProvider } from './osmCommercialProvider.js';
import { SecEdgarProvider } from './secEdgarProvider.js';

export const csvImportProviderInstance = new CsvImportProvider();

export const providers: Record<string, LeadProvider> = {
  sec_edgar: new SecEdgarProvider(),
  osm_commercial: new OsmCommercialProvider(),
  google_places: new GooglePlacesProvider(),
  b2b_contacts: new B2BContactProvider(),
  csv_import: csvImportProviderInstance,
};

export function getProvider(providerId: string): LeadProvider {
  const provider = providers[providerId];
  if (!provider) {
    throw new Error(`Unknown provider: "${providerId}". Available: ${Object.keys(providers).join(', ')}`);
  }
  return provider;
}

export function listProviders() {
  return Object.values(providers).map((p) => {
    let hasKey = true;
    let requiresKey = false;
    let keyEnvVar = '';
    let isDeferred = false;
    let statusNote = 'Active & Ready';

    if (p.id === 'google_places') {
      requiresKey = true;
      keyEnvVar = 'GOOGLE_PLACES_API_KEY';
      hasKey = Boolean(process.env.GOOGLE_PLACES_API_KEY);
      isDeferred = !hasKey;
      statusNote = hasKey
        ? 'Active (Key Configured)'
        : 'Optional / Deferred (Pending Bank Verification)';
    } else if (p.id === 'b2b_contacts') {
      requiresKey = true;
      keyEnvVar = 'APOLLO_API_KEY / HUNTER_API_KEY';
      hasKey = Boolean(process.env.APOLLO_API_KEY || process.env.HUNTER_API_KEY);
      statusNote = hasKey ? 'Active (Key Configured)' : 'Optional (API Key Required)';
    } else if (p.id === 'sec_edgar') {
      statusNote = 'Public Live Feed (Zero Setup Required)';
    } else if (p.id === 'osm_commercial') {
      statusNote = 'Public Live Feed (Zero Setup Required)';
    } else if (p.id === 'csv_import') {
      statusNote = 'Dataset Importer (Ready)';
    }

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      isMock: false,
      requiresKey,
      keyEnvVar,
      hasKey,
      isDeferred,
      statusNote,
    };
  });
}
