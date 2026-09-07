import React, { useState } from 'react';
import { Play, CheckCircle2, Clock, Loader2, Key } from 'lucide-react';
import { IngestionJob, ProviderInfo } from '../types.js';

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
}

const COMMON_INDUSTRIES = [
  'Software & SaaS',
  'Healthcare & Biotechnology',
  'Industrial Manufacturing',
  'Financial Services & Fintech',
  'Commercial Real Estate',
  'Supply Chain & Logistics',
  'CleanTech & Energy',
  'Professional Consulting',
];

const COMMON_STATES = [
  'TX', 'CA', 'NY', 'FL', 'IL', 'WA', 'MA', 'CO', 'GA', 'NC', 'OH', 'PA'
];

export const IngestionControlPanel: React.FC<IngestionControlPanelProps> = ({
  providers,
  jobs,
  onStartIngest,
  isIngesting,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('mock');
  const [industry, setIndustry] = useState<string>('Software & SaaS');
  const [city, setCity] = useState<string>('Austin');
  const [state, setState] = useState<string>('TX');
  const [zip, setZip] = useState<string>('78701');
  const [targetCount, setTargetCount] = useState<number>(10);
  const [autoEnrich, setAutoEnrich] = useState<boolean>(true);

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
      {/* New Ingestion Job */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
          New Ingestion Job
        </h3>
        <div className="space-y-4 bg-slate-900 p-4 sm:p-5 rounded-lg border border-slate-800 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-3.5" id="ingestion-form">
            {/* Provider Adapter Selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                  Provider Adapter
                </label>
                {activeProvider && (
                  <span
                    className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      activeProvider.hasKey
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {activeProvider.hasKey ? (
                      <>
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Ready</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-2.5 h-2.5" />
                        <span>Sandbox</span>
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
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isMock ? '(Sandbox)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Industry Keyword */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-medium uppercase tracking-wider">
                Industry Keyword
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Software & SaaS, Biotech"
                list="industry-suggestions"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs sm:text-sm text-slate-200 outline-none focus:border-blue-500"
                id="input-industry"
              />
              <datalist id="industry-suggestions">
                {COMMON_INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind} />
                ))}
              </datalist>
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
                  min={5}
                  max={50}
                  step={5}
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
                <span>Auto-enrich decision makers &amp; corporate emails</span>
              </label>
            </div>

            {/* Initialize Pipeline Button */}
            <button
              type="submit"
              disabled={isIngesting}
              className="w-full py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold text-xs transition-colors mt-2 uppercase tracking-wider flex items-center justify-center space-x-2 disabled:opacity-50"
              id="start-ingestion-btn"
            >
              {isIngesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>INITIALIZING PIPELINE...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>INITIALIZE PIPELINE</span>
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
            Active Job Monitor
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
                Run an import using the panel above to stream leads.
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

              // Determine border accent
              const borderClass = isRunning
                ? 'border-l-blue-500'
                : isCompleted
                ? 'border-l-green-500'
                : isFailed
                ? 'border-l-red-500'
                : 'border-l-yellow-600';

              const badgeColor = isRunning
                ? 'text-blue-400'
                : isCompleted
                ? 'text-green-400'
                : isFailed
                ? 'text-red-400'
                : 'text-yellow-500';

              const percent = Math.min(
                100,
                Math.max(
                  isRunning ? 50 : 10,
                  Math.round((job.total_imported / (job.total_found || 10)) * 100) ||
                    (isCompleted ? 100 : 25)
                )
              );

              return (
                <div
                  key={job.id}
                  className={`p-3 bg-slate-900 border-l-4 ${borderClass} rounded border border-slate-800 text-xs shadow-xs`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-bold text-slate-200">
                      JOB-{job.id.slice(0, 4).toUpperCase()} ({job.provider.toUpperCase()})
                    </span>
                    <span className={`text-[10px] font-semibold ${badgeColor}`}>
                      {isRunning ? 'Running...' : isCompleted ? '100%' : job.status}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isCompleted
                          ? 'bg-green-500'
                          : isFailed
                          ? 'bg-red-500'
                          : isRunning
                          ? 'bg-blue-500 animate-pulse'
                          : 'bg-yellow-500'
                      }`}
                      style={{
                        width: isCompleted ? '100%' : `${percent}%`,
                      }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-500 mt-2 truncate">
                    {isCompleted
                      ? `Enrichment Complete: ${job.total_imported} Records`
                      : isRunning
                      ? `Ingesting: ${parsedQuery.industry || 'B2B'} / ${parsedQuery.city || 'Austin'}, ${
                          parsedQuery.state || 'TX'
                        }`
                      : isFailed
                      ? `Failed: ${job.error_message || 'Connection error'}`
                      : `Queued: ${job.total_imported} imported`}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
