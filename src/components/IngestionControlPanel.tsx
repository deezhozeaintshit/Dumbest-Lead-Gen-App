import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, Clock, Loader2, Key, FileSpreadsheet, Layers, Globe, Sparkles, Compass } from 'lucide-react';
import { IngestionJob, ProviderInfo } from '../types.js';
import { BUSINESS_TAXONOMY, getCategoryById, getAllSubNiches } from '../data/businessTaxonomy.js';
import { NicheSelectorModal } from './NicheSelectorModal.js';

interface IngestionControlPanelProps {
  providers: ProviderInfo[];
  jobs: IngestionJob[];
  onStartIngest: (params: {
    providerId: string;
    industry: string;
    city: string;
    state: string;
    zip: string;
    targetCount: number;
    autoEnrich: boolean;
  }) => Promise<void>;
  isIngesting: boolean;
  onOpenCsvModal?: () => void;
  onOpenAdaptersModal?: () => void;
}

const COMMON_STATES = [
  'TX', 'CA', 'NY', 'FL', 'IL', 'WA', 'MA', 'CO', 'GA', 'NC', 'OH', 'PA'
];

export const IngestionControlPanel: React.FC<IngestionControlPanelProps> = ({
  providers,
  jobs,
  onStartIngest,
  isIngesting,
  onOpenCsvModal,
  onOpenAdaptersModal,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<string>(
    providers[0]?.id || 'sec_edgar'
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('saas_cloud');
  const [isNicheModalOpen, setIsNicheModalOpen] = useState<boolean>(false);
  const [industry, setIndustry] = useState<string>('B2B Enterprise SaaS');
  const [city, setCity] = useState<string>('Austin');
  const [state, setState] = useState<string>('TX');
  const [zip, setZip] = useState<string>('78701');
  const [targetCount, setTargetCount] = useState<number>(10);
  const [autoEnrich, setAutoEnrich] = useState<boolean>(true);

  const currentCategory = getCategoryById(selectedCategoryId) || BUSINESS_TAXONOMY[0];

  const handleCategoryChange = (catId: string) => {
    setSelectedCategoryId(catId);
    const cat = getCategoryById(catId);
    if (cat && cat.subNiches.length > 0) {
      setIndustry(cat.subNiches[0]);
    }
  };

  const handleSelectFromModal = (subNiche: string, categoryName: string) => {
    setIndustry(subNiche);
    const foundCat = BUSINESS_TAXONOMY.find((c) => c.name === categoryName);
    if (foundCat) {
      setSelectedCategoryId(foundCat.id);
    }
  };

  // Synchronize default selected provider when list loads (prefer ready public feeds)
  useEffect(() => {
    if (providers.length > 0) {
      const isCurrentValid = providers.some((p) => p.id === selectedProvider && p.id !== 'mock');
      const currentProvider = providers.find((p) => p.id === selectedProvider);

      if (!isCurrentValid || currentProvider?.isDeferred) {
        const readyProvider =
          providers.find((p) => p.id === 'sec_edgar') ||
          providers.find((p) => p.hasKey && !p.isDeferred) ||
          providers[0];
        setSelectedProvider(readyProvider.id);
      }
    }
  }, [providers, selectedProvider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onStartIngest({
      providerId: selectedProvider,
      industry,
      city,
      state,
      zip,
      targetCount,
      autoEnrich,
    });
  };

  const activeProvider = providers.find((p) => p.id === selectedProvider);

  return (
    <div className="space-y-6">
      {/* Quick Actions Bar */}
      <div className="flex items-center gap-2">
        {onOpenCsvModal && (
          <button
            type="button"
            onClick={onOpenCsvModal}
            className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
            id="btn-open-csv-ingest"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import CSV Dataset</span>
          </button>
        )}
        {onOpenAdaptersModal && (
          <button
            type="button"
            onClick={onOpenAdaptersModal}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
            id="btn-open-adapters"
            title="Inspect API Adapters & Test Feeds"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Feeds</span>
          </button>
        )}
      </div>

      {/* New Ingestion Job */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
          Live Ingestion Pipeline
        </h3>
        <div className="space-y-4 bg-slate-900 p-4 sm:p-5 rounded-lg border border-slate-800 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-3.5" id="ingestion-form">
            {/* Provider Adapter Selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                  Live API Feed
                </label>
                {activeProvider && (
                  <span
                    className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      activeProvider.hasKey
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : activeProvider.isDeferred
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {activeProvider.hasKey ? (
                      <>
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>{activeProvider.requiresKey ? 'Key Configured' : 'Live Public API'}</span>
                      </>
                    ) : activeProvider.isDeferred ? (
                      <>
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Deferred (Can Wait)</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-2.5 h-2.5" />
                        <span>Needs Key</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs sm:text-sm text-slate-200 outline-none focus:border-blue-500"
                id="select-provider"
              >
                <optgroup label="Active Production Feeds (Ready to Ingest)">
                  {providers
                    .filter((p) => !p.isDeferred && p.id !== 'google_places')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.requiresKey && !p.hasKey ? '(Requires Key)' : '• Active'}
                      </option>
                    ))}
                </optgroup>
                {providers.some((p) => p.isDeferred || p.id === 'google_places') && (
                  <optgroup label="Optional / Deferred Integrations">
                    {providers
                      .filter((p) => p.isDeferred || p.id === 'google_places')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.hasKey ? '• Active' : '• Deferred (Pending Bank Verification)'}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
              {activeProvider?.isDeferred ? (
                <div className="mt-2 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded text-[11px] text-blue-300 flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold">Google Places can wait:</span> While waiting for bank verification, the application is 100% production ready using <strong>SEC EDGAR</strong> and <strong>OpenStreetMap</strong>. Select either feed to ingest live leads.
                  </div>
                </div>
              ) : activeProvider?.requiresKey && !activeProvider.hasKey ? (
                <p className="text-[11px] text-amber-400 mt-1">
                  Requires {activeProvider.keyEnvVar} in environment.
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1">
                  {activeProvider?.statusNote || 'Production ready live feed'}
                </p>
              )}
            </div>

            {/* Main Category & Sub-Niche Cascading Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                  Target Niche / Category ({BUSINESS_TAXONOMY.length})
                </label>
                <button
                  type="button"
                  onClick={() => setIsNicheModalOpen(true)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1 py-0.5 px-1.5 rounded hover:bg-blue-500/10 transition-colors"
                  id="btn-browse-all-niches"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Browse 440+ Niches</span>
                </button>
              </div>

              {/* Category Select */}
              <select
                value={selectedCategoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500"
                id="select-business-category"
              >
                {BUSINESS_TAXONOMY.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    [{cat.code}] {cat.name} ({cat.subNiches.length} niches)
                  </option>
                ))}
              </select>

              {/* Sub-Niche Quick Select / Search */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium uppercase tracking-wider flex items-center justify-between">
                  <span>Sub-Niche / Search Keyword</span>
                  <span className="text-[10px] text-slate-500 lowercase">
                    {currentCategory.subNiches.length} sub-niches available
                  </span>
                </label>
                <div className="space-y-1.5">
                  <select
                    value={currentCategory.subNiches.includes(industry) ? industry : ''}
                    onChange={(e) => {
                      if (e.target.value) setIndustry(e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500"
                    id="select-sub-niche"
                  >
                    <option value="" disabled>-- Select from {currentCategory.name} --</option>
                    {currentCategory.subNiches.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="Or type custom keyword (e.g. Threat Intelligence, HVAC)..."
                    list="sub-niche-suggestions"
                    required
                    className="w-full bg-slate-950/80 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500 placeholder-slate-600"
                    id="input-industry"
                  />
                  <datalist id="sub-niche-suggestions">
                    {currentCategory.subNiches.map((sub) => (
                      <option key={sub} value={sub} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            {/* Location & Target Count */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium uppercase tracking-wider">
                  Location (City)
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Austin"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs sm:text-sm text-slate-200 outline-none focus:border-blue-500"
                  id="input-city"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium uppercase tracking-wider">
                  Target Count
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  value={targetCount}
                  onChange={(e) => setTargetCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs sm:text-sm text-slate-200 outline-none focus:border-blue-500"
                  id="input-target-count"
                />
              </div>
            </div>

            {/* State & Zip */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium uppercase tracking-wider">
                  State
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs sm:text-sm text-slate-200 outline-none focus:border-blue-500"
                  id="select-state"
                >
                  {COMMON_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium uppercase tracking-wider">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="e.g. 78701"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs sm:text-sm text-slate-200 outline-none focus:border-blue-500"
                  id="input-zip"
                />
              </div>
            </div>

            {/* Auto Enrich Checkbox */}
            <div className="pt-1">
              <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoEnrich}
                  onChange={(e) => setAutoEnrich(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  id="checkbox-auto-enrich"
                />
                <span>Live DNS MX email verification &amp; multi-tier scoring</span>
              </label>
            </div>

            {/* Initialize Pipeline Button */}
            <button
              type="submit"
              disabled={isIngesting || activeProvider?.isDeferred || (activeProvider?.requiresKey && !activeProvider?.hasKey)}
              className="w-full py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded font-semibold text-xs transition-colors mt-2 uppercase tracking-wider flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
              id="start-ingestion-btn"
            >
              {isIngesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>EXECUTING INGESTION PIPELINE...</span>
                </>
              ) : activeProvider?.isDeferred ? (
                <span>SWITCH TO SEC EDGAR OR OPENSTREETMAP TO INGEST</span>
              ) : activeProvider?.requiresKey && !activeProvider.hasKey ? (
                <span>REQUIRES {activeProvider.keyEnvVar}</span>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>EXECUTE PRODUCTION INGESTION PIPELINE</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Active Job Monitor */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Pipeline Execution History
          </h3>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            {jobs.length} total
          </span>
        </div>

        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-0.5">
          {jobs.length === 0 ? (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-center">
              <Clock className="w-5 h-5 text-slate-600 mx-auto mb-1.5" />
              <p className="text-xs text-slate-400 font-medium">No ingestion jobs run yet</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Run an import using the panel above to ingest live leads.
              </p>
            </div>
          ) : (
            jobs.map((job) => {
              let parsedQuery: any = {};
              try {
                parsedQuery = JSON.parse(job.query_params);
              } catch {}

              const isRunning = job.status === 'RUNNING';
              const isCompleted = job.status === 'COMPLETED';
              const isFailed = job.status === 'FAILED';

              const borderClass = isRunning
                ? 'border-l-blue-500'
                : isCompleted
                ? 'border-l-green-500'
                : isFailed
                ? 'border-l-red-500'
                : 'border-l-yellow-600';

              return (
                <div
                  key={job.id}
                  className={`bg-slate-900 border border-slate-800 border-l-4 ${borderClass} rounded-lg p-3 space-y-2 text-xs`}
                  id={`job-card-${job.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-200 capitalize">
                        {job.provider.replace(/_/g, ' ')}
                      </span>
                      {isRunning && <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isRunning
                          ? 'bg-blue-500/20 text-blue-400'
                          : isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isFailed
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>
                      Target:{' '}
                      <span className="text-slate-200 font-medium">
                        {parsedQuery.industry || parsedQuery.query || 'B2B Leads'}
                      </span>
                      {parsedQuery.city && <span> &bull; {parsedQuery.city}</span>}
                    </span>
                    <span className="font-mono">
                      {job.total_imported} / {job.total_found || '?'} saved
                    </span>
                  </div>

                  {job.error_message && (
                    <p className="text-[11px] text-red-400 bg-red-950/40 p-1.5 rounded border border-red-900/50">
                      {job.error_message}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 440+ Niches & Sub-Niches Taxonomy Modal */}
      <NicheSelectorModal
        isOpen={isNicheModalOpen}
        onClose={() => setIsNicheModalOpen(false)}
        onSelectNiche={handleSelectFromModal}
        currentNiche={industry}
      />
    </div>
  );
};
