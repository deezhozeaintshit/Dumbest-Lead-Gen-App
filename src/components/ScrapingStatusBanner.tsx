import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, X, Sparkles, Database } from 'lucide-react';
import { IngestionJob } from '../types.js';

interface ScrapingStatusBannerProps {
  activeJob: IngestionJob | null;
  completedAlert: {
    id: string;
    provider: string;
    imported: number;
    totalFound: number;
    timestamp: Date;
  } | null;
  onDismissAlert: () => void;
  onViewLeads: () => void;
}

export const ScrapingStatusBanner: React.FC<ScrapingStatusBannerProps> = ({
  activeJob,
  completedAlert,
  onDismissAlert,
  onViewLeads,
}) => {
  if (!activeJob && !completedAlert) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-3">
      {/* Active Scraping In-Progress Banner */}
      {activeJob && (
        <div
          className="bg-blue-950/60 border border-blue-500/40 rounded-lg p-3 sm:p-4 text-xs text-blue-200 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse"
          id="scraping-in-progress-banner"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-400 shrink-0">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white uppercase tracking-wider text-[11px] bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
                  Scraping &amp; Ingesting Leads in Real Time
                </span>
                <span className="text-blue-300 font-mono text-[11px]">
                  Job #{activeJob.id.slice(0, 8)}
                </span>
              </div>
              <p className="text-slate-300 text-xs mt-1">
                Querying <span className="font-semibold text-white capitalize">{activeJob.provider.replace(/_/g, ' ')}</span>. Deduplicating records, validating domain DNS MX servers, and persisting leads to SQLite...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 self-start sm:self-center shrink-0">
            <div className="text-right">
              <div className="text-[10px] text-blue-400 uppercase font-mono tracking-wider">
                Ingested So Far
              </div>
              <div className="text-sm font-bold text-white font-mono">
                {activeJob.total_imported} Records
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completed Scraping Alert Banner */}
      {!activeJob && completedAlert && (
        <div
          className="bg-emerald-950/60 border border-emerald-500/40 rounded-lg p-3 sm:p-4 text-xs text-emerald-200 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
          id="scraping-completed-banner"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 border border-emerald-400/30 rounded-lg text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-emerald-300 uppercase tracking-wider text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Scraping Finished!</span>
                </span>
                <span className="text-slate-400 text-[11px]">
                  Just now ({completedAlert.timestamp.toLocaleTimeString()})
                </span>
              </div>
              <p className="text-slate-200 text-xs mt-1">
                Successfully ingested <strong className="text-white">{completedAlert.imported} verified B2B leads</strong> from <span className="capitalize font-semibold text-emerald-300">{completedAlert.provider.replace(/_/g, ' ')}</span> into your database with full deliverability checks.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-start sm:self-center">
            <button
              onClick={onViewLeads}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs transition-colors flex items-center space-x-1.5 shadow-sm"
              id="banner-view-leads-btn"
            >
              <Database className="w-3.5 h-3.5" />
              <span>View Ingested Leads</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDismissAlert}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800/60 transition-colors"
              title="Dismiss notification"
              id="banner-dismiss-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
