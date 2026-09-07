import React from 'react';
import { X, Settings, Shield, Sliders, Database, KeyRound, CheckCircle2 } from 'lucide-react';
import { ProviderInfo } from '../types.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: ProviderInfo[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  providers,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        id="settings-modal"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Pipeline Settings &amp; Ingestion Rules</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Deduplication hierarchies, scoring thresholds, and security parameters.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Deduplication Hierarchy */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Deduplication Hierarchy Rules</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">1. Domain Normalization</span>
                <span className="text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Primary Match (Strict)
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Strips protocols, &apos;www.&apos; prefixes, and URL paths. Matches corporate domains across providers.
              </p>

              <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                <span className="text-slate-300 font-medium">2. E.164 Phone Number</span>
                <span className="text-blue-400 font-mono text-[11px] bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  Secondary Match
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Extracts standardized 10-digit national numbers to catch records with distinct landing URLs.
              </p>

              <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                <span className="text-slate-300 font-medium">3. Legal Business Name + ZIP</span>
                <span className="text-amber-400 font-mono text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Tertiary Match
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Removes legal entity suffixes (Inc, LLC, Corp, Ltd) and matches against postal territory.
              </p>
            </div>
          </div>

          {/* Scoring Engine Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-blue-400" />
              <span>Multi-Attribute Scoring Weights (0-100 pts)</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800">
                <div className="text-slate-400 text-[11px]">Industry Alignment</div>
                <div className="text-base font-semibold text-white mt-0.5">25 pts max</div>
                <div className="text-[10px] text-slate-500 mt-1">SaaS, MedTech, FinTech &amp; Enterprise</div>
              </div>
              <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800">
                <div className="text-slate-400 text-[11px]">Company Scale</div>
                <div className="text-base font-semibold text-white mt-0.5">25 pts max</div>
                <div className="text-[10px] text-slate-500 mt-1">Employee count tiers (5 - 500+)</div>
              </div>
              <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800">
                <div className="text-slate-400 text-[11px]">Decision Makers</div>
                <div className="text-base font-semibold text-white mt-0.5">25 pts max</div>
                <div className="text-[10px] text-slate-500 mt-1">Verified C-Level, VP, &amp; Directors</div>
              </div>
              <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800">
                <div className="text-slate-400 text-[11px]">Email Deliverability</div>
                <div className="text-base font-semibold text-white mt-0.5">25 pts max</div>
                <div className="text-[10px] text-slate-500 mt-1">Live DNS MX server resolution</div>
              </div>
            </div>
          </div>

          {/* Infrastructure & Security Vault */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Database className="w-4 h-4 text-purple-400" />
              <span>Infrastructure &amp; Security Vault</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Database Engine</span>
                <span className="font-mono text-slate-400">SQLite (Prisma ORM) &bull; prisma/dev.db</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Session Security</span>
                <span className="font-mono text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>HMAC-SHA256 JWT Vault</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Active API Feeds</span>
                <span className="font-mono text-blue-400">{providers.length} Registered Adapters</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
