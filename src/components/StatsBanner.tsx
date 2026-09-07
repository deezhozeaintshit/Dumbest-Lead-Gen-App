import React from 'react';
import { Users, Building2, UserCheck, Activity, Download, Award, ShieldCheck, MailCheck } from 'lucide-react';
import { PipelineStats } from '../types.js';

interface StatsBannerProps {
  stats: PipelineStats | null;
  onExportCsv: () => void;
  isExporting: boolean;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({ stats, onExportCsv, isExporting }) => {
  const total = stats?.totalLeads || 0;
  const enriched = stats?.enrichedLeads || 0;
  const enrichmentRate = total > 0 ? ((enriched / total) * 100).toFixed(1) : '0.0';
  const contacts = stats?.totalContacts || 0;
  const activeJobs = stats?.activeJobs || 0;
  const validEmails = stats?.emailStats?.valid || 0;
  const avgScore = stats?.scoringStats?.averageScore || 0;
  const highScoreLeads = stats?.scoringStats?.highScoreLeads || 0;

  return (
    <div className="space-y-3 mb-6">
      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Leads</p>
              <div className="w-7 h-7 rounded bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Building2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-bold mt-1 text-slate-100">{total.toLocaleString()}</p>
          </div>
          <p className="text-[10px] text-green-400 mt-2 font-medium">
            {stats?.newLeads || 0} new &bull; {stats?.contactedLeads || 0} contacted
          </p>
        </div>

        {/* Lead Scoring Index */}
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Scoring Index</p>
              <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Award className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold text-slate-100">{avgScore}</p>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                {highScoreLeads} Tier 1
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Weighted rules: Industry, Size &amp; Title</p>
        </div>

        {/* Email Health */}
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Email Deliverability</p>
              <div className="w-7 h-7 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <MailCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold text-slate-100">{validEmails}</p>
              <span className="text-[10px] font-semibold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                {stats?.emailStats?.invalid ? `${stats.emailStats.invalid} Invalid` : 'Zero Bounces'}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Validated via MX &amp; ZeroBounce engine</p>
        </div>

        {/* Pipeline Engine / Export */}
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Pipeline Engine</p>
              {activeJobs > 0 ? (
                <span className="flex items-center space-x-1 text-[10px] font-medium text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 animate-pulse">
                  <Activity className="w-3 h-3" />
                  <span>{activeJobs} Active</span>
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-mono">SQLite Local</span>
              )}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-2xl font-bold text-slate-100">{stats?.totalJobs || 0} Jobs</p>
              <button
                onClick={onExportCsv}
                disabled={isExporting || total === 0}
                className="px-2.5 py-1 bg-blue-600 text-xs font-semibold rounded hover:bg-blue-500 transition-colors text-white disabled:opacity-40 flex items-center gap-1"
                id="export-csv-stat-btn"
              >
                <Download className="w-3 h-3" />
                <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 truncate">
            {enrichmentRate}% enriched • {contacts} decision makers
          </p>
        </div>
      </div>
    </div>
  );
};
