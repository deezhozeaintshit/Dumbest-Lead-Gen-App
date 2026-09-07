import React from 'react';
import { RefreshCw, Sparkles, Menu, Download } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton.js';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  onSeedSample: () => void;
  isSeeding: boolean;
  totalLeads: number;
  activeJobsCount: number;
  onToggleMobileMenu: () => void;
  onExportCsv?: () => void;
  isExporting?: boolean;
  activeTab?: 'dashboard' | 'explorer' | 'jobs' | 'adapters' | 'settings' | 'niches';
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isRefreshing,
  onSeedSample,
  isSeeding,
  totalLeads,
  activeJobsCount,
  onToggleMobileMenu,
  onExportCsv,
  isExporting,
  activeTab = 'dashboard',
}) => {
  const getTitles = () => {
    switch (activeTab) {
      case 'niches':
        return {
          title: 'Business Niches & Category Directory',
          subtitle: '44 categories & 440+ verified B2B sub-niches for targeted scraping',
        };
      case 'explorer':
        return {
          title: 'Lead Explorer',
          subtitle: 'Search, filter, inspect, and export enriched B2B prospects',
        };
      case 'jobs':
        return {
          title: 'Ingestion Pipeline & Background Jobs',
          subtitle: 'Real-time scraping execution telemetry and background sync logs',
        };
      case 'adapters':
        return {
          title: 'External API Adapters',
          subtitle: 'Live B2B registry feeds, ping diagnostics, and bank verification status',
        };
      case 'settings':
        return {
          title: 'Settings & Scoring Rules',
          subtitle: 'Deduplication hierarchy, scoring weights, and SQLite vault',
        };
      default:
        return {
          title: 'Executive Command Dashboard',
          subtitle: 'Real-time B2B Pipeline Analytics & Lead Ingestion',
        };
    }
  };

  const { title, subtitle } = getTitles();

  return (
    <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-[#09090B] text-slate-200 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-md hover:bg-slate-800/40"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-medium text-slate-100 tracking-tight">{title}</h1>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Real-time telemetry indicators */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span className="text-slate-400 font-mono uppercase tracking-wider text-[11px]">
            Engine Status: Live
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              activeJobsCount > 0 ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'
            }`}
          ></span>
          <span className="text-slate-400 font-mono uppercase tracking-wider text-[11px]">
            Jobs: {activeJobsCount} Active
          </span>
        </div>

        {totalLeads === 0 && (
          <button
            onClick={onSeedSample}
            disabled={isSeeding}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
            id="seed-sample-btn"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSeeding ? 'Seeding...' : 'Load Sample Leads'}</span>
          </button>
        )}

        {onExportCsv && (
          <button
            onClick={onExportCsv}
            disabled={isExporting || totalLeads === 0}
            className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 text-xs font-semibold rounded-md hover:bg-blue-500 transition-colors text-white disabled:opacity-40"
            id="header-export-btn"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        )}

        {/* In-App Android & Mobile PWA Install Button */}
        <PWAInstallButton />

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 sm:p-2 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-800 disabled:opacity-50"
          title="Refresh Data"
          id="refresh-data-btn"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};

