import React, { useState } from 'react';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  Search,
  ArrowRight,
  Database,
  Loader2,
  Calendar,
  Layers,
  MapPin,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { IngestionJob, ProviderInfo } from '../types.js';
import { IngestionControlPanel } from './IngestionControlPanel.js';

interface JobsViewProps {
  jobs: IngestionJob[];
  providers: ProviderInfo[];
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
  onOpenAdaptersModal: () => void;
  onOpenCsvModal: () => void;
  onViewLeadsByProvider: (providerId: string) => void;
}

export const JobsView: React.FC<JobsViewProps> = ({
  jobs,
  providers,
  onStartIngest,
  isIngesting,
  onOpenAdaptersModal,
  onOpenCsvModal,
  onViewLeadsByProvider,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'RUNNING' | 'COMPLETED' | 'FAILED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const runningCount = jobs.filter((j) => j.status === 'RUNNING' || j.status === 'PENDING').length;
  const completedCount = jobs.filter((j) => j.status === 'COMPLETED').length;
  const failedCount = jobs.filter((j) => j.status === 'FAILED').length;

  const filteredJobs = jobs.filter((j) => {
    if (filterStatus === 'RUNNING' && j.status !== 'RUNNING' && j.status !== 'PENDING') return false;
    if (filterStatus === 'COMPLETED' && j.status !== 'COMPLETED') return false;
    if (filterStatus === 'FAILED' && j.status !== 'FAILED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchProvider = j.provider.toLowerCase().includes(q);
      const matchQuery = j.query_params.toLowerCase().includes(q);
      const matchId = j.id.toLowerCase().includes(q);
      if (!matchProvider && !matchQuery && !matchId) return false;
    }
    return true;
  });

  const handleRetryJob = (job: IngestionJob) => {
    let parsed: any = {};
    try {
      parsed = JSON.parse(job.query_params);
    } catch {}

    onStartIngest({
      providerId: job.provider,
      industry: parsed.industry || 'Technology',
      city: parsed.city || 'Austin',
      state: parsed.state || 'TX',
      zip: parsed.zip || '78701',
      targetCount: 10,
      autoEnrich: true,
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto flex-1 min-h-0" id="jobs-page-container">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Ingestion Pipeline &amp; Scraping Job Center
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time execution telemetry, background scraper jobs, and deduplication sync logs.
              </p>
            </div>
          </div>
        </div>

        {/* Top Summary Badges */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center space-x-2">
            <span className="text-slate-400">Total Scrapes:</span>
            <span className="font-bold text-white font-mono">{jobs.length}</span>
          </div>
          {runningCount > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs flex items-center space-x-2 animate-pulse text-blue-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{runningCount} Running Now</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Control Panel on Left, Jobs List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Launch New Ingestion (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Launch Ingestion Job</span>
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Zero-Mock Live Feeds
            </span>
          </div>

          <IngestionControlPanel
            onStartIngest={onStartIngest}
            isIngesting={isIngesting}
            jobs={jobs.slice(0, 3)}
            providers={providers}
            onOpenAdaptersModal={onOpenAdaptersModal}
            onOpenCsvModal={onOpenCsvModal}
          />
        </div>

        {/* Right Column: Execution History & Queue (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center space-x-1.5 overflow-x-auto">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  filterStatus === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                id="filter-jobs-all"
              >
                All Jobs ({jobs.length})
              </button>
              <button
                onClick={() => setFilterStatus('RUNNING')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                  filterStatus === 'RUNNING'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                id="filter-jobs-running"
              >
                {runningCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                <span>Running ({runningCount})</span>
              </button>
              <button
                onClick={() => setFilterStatus('COMPLETED')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  filterStatus === 'COMPLETED'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                id="filter-jobs-completed"
              >
                Completed ({completedCount})
              </button>
              <button
                onClick={() => setFilterStatus('FAILED')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  filterStatus === 'FAILED'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                id="filter-jobs-failed"
              >
                Failed ({failedCount})
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs..."
                className="bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1 text-xs text-slate-200 outline-none focus:border-blue-500 w-full sm:w-48"
              />
            </div>
          </div>

          {/* Jobs List */}
          <div className="space-y-3">
            {filteredJobs.length === 0 ? (
              <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-xl text-center space-y-2">
                <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No jobs match your filter</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Execute a scrape using SEC EDGAR or OpenStreetMap on the left panel to begin ingesting leads.
                </p>
              </div>
            ) : (
              filteredJobs.map((job) => {
                let parsedQuery: any = {};
                try {
                  parsedQuery = JSON.parse(job.query_params);
                } catch {}

                const isRunning = job.status === 'RUNNING' || job.status === 'PENDING';
                const isCompleted = job.status === 'COMPLETED';
                const isFailed = job.status === 'FAILED';

                const createdDate = new Date(job.created_at);
                const updatedDate = new Date(job.updated_at);
                const durationMs = updatedDate.getTime() - createdDate.getTime();
                const durationSec = (durationMs / 1000).toFixed(1);

                return (
                  <div
                    key={job.id}
                    className={`bg-slate-900 border ${
                      isRunning
                        ? 'border-blue-500/50 shadow-lg shadow-blue-500/5'
                        : isCompleted
                        ? 'border-slate-800 hover:border-slate-700'
                        : 'border-red-500/30'
                    } rounded-xl p-4 sm:p-5 transition-all space-y-3`}
                    id={`job-row-${job.id}`}
                  >
                    {/* Top Row: Provider and Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        <span className="text-sm font-bold text-white capitalize">
                          {job.provider.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          #{job.id.slice(0, 8)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 self-start sm:self-center">
                        {isRunning && (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 animate-pulse">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>SCRAPING IN PROGRESS</span>
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>COMPLETED</span>
                          </span>
                        )}
                        {isFailed && (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>FAILED</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar for Active Jobs */}
                    {isRunning && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] text-blue-300">
                          <span>Live Ingestion Pipeline Running...</span>
                          <span className="font-mono">{job.total_imported} imported so far</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full animate-pulse w-3/4" />
                        </div>
                      </div>
                    )}

                    {/* Job Query Metrics / Parameters */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-lg text-xs">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Vertical / Query</div>
                        <div className="font-medium text-slate-200 truncate mt-0.5">
                          {parsedQuery.industry || parsedQuery.query || 'Technology'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Geography</div>
                        <div className="font-medium text-slate-200 truncate mt-0.5">
                          {[parsedQuery.city, parsedQuery.state].filter(Boolean).join(', ') || 'All Regions'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Scraped &amp; Available</div>
                        <div className="font-medium text-slate-200 font-mono mt-0.5">
                          {job.total_found > 0 ? `${job.total_found} leads` : isRunning ? 'Scanning...' : '0'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Ingested into DB</div>
                        <div className="font-bold text-emerald-400 font-mono mt-0.5">
                          {job.total_imported} saved
                        </div>
                      </div>
                    </div>

                    {/* Error Message Banner if Failed */}
                    {isFailed && job.error_message && (
                      <div className="p-3 bg-red-950/40 border border-red-500/30 rounded text-xs text-red-300 space-y-1">
                        <div className="font-semibold flex items-center space-x-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Ingestion Halt Reason:</span>
                        </div>
                        <p className="text-[11px] font-mono opacity-90">{job.error_message}</p>
                      </div>
                    )}

                    {/* Footer Row: Timestamp, Duration & Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{createdDate.toLocaleString()}</span>
                        </span>
                        {isCompleted && (
                          <span className="text-slate-500 font-mono">
                            Duration: {durationSec}s
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {isCompleted && job.total_imported > 0 && (
                          <button
                            onClick={() => onViewLeadsByProvider(job.provider)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold flex items-center space-x-1 transition-colors border border-slate-700"
                            id={`view-leads-job-${job.id}`}
                          >
                            <Database className="w-3 h-3 text-blue-400" />
                            <span>View Ingested Leads</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        {isFailed && (
                          <button
                            onClick={() => handleRetryJob(job)}
                            className="px-2.5 py-1 bg-red-900/40 hover:bg-red-900/60 text-red-200 rounded text-xs font-semibold flex items-center space-x-1 transition-colors border border-red-700/50"
                            id={`retry-job-${job.id}`}
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Retry Ingestion</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
