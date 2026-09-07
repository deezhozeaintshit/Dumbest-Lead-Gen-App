import React from 'react';
import {
  Settings,
  Shield,
  Sliders,
  Database,
  KeyRound,
  CheckCircle2,
  HardDrive,
  Cpu,
  Layers,
} from 'lucide-react';
import { ProviderInfo } from '../types.js';

interface SettingsViewProps {
  providers: ProviderInfo[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({ providers }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto flex-1 min-h-0" id="settings-page-container">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Pipeline Architecture, Deduplication &amp; Scoring Rules
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Production data normalization rules, multi-attribute scoring weights, and database vault.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Production Engine Active</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Rules & Normalization (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Deduplication Hierarchy */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Deterministic Deduplication Hierarchy
                </h3>
                <p className="text-xs text-slate-400">
                  Every ingested business record passes through a 3-tier matching cascade before database insert.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-[11px]">1</span>
                    <span>Domain Normalization (Strict)</span>
                  </span>
                  <span className="text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Primary Key
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] pl-6.5 leading-relaxed">
                  Strips protocols (<code className="text-blue-400">https://</code>), leading <code className="text-blue-400">www.</code> prefixes, trailing slashes, and path parameters. Cross-provider domain matching guarantees zero duplicate companies.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono text-[11px]">2</span>
                    <span>E.164 Phone Number Standardization</span>
                  </span>
                  <span className="text-blue-400 font-mono text-[10px] bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    Secondary Key
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] pl-6.5 leading-relaxed">
                  Extracts raw 10-digit national numbers and international dialing codes to catch duplicate business entities that host distinct landing pages or product domains.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono text-[11px]">3</span>
                    <span>Normalized Legal Name + Postal ZIP</span>
                  </span>
                  <span className="text-amber-400 font-mono text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Tertiary Key
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] pl-6.5 leading-relaxed">
                  Removes corporate legal suffixes (<code className="text-amber-400">Inc, LLC, Corp, Ltd, Co</code>), strips punctuation, and matches against postal territory coordinates.
                </p>
              </div>
            </div>
          </div>

          {/* Scoring Engine Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-400">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Multi-Attribute Lead Scoring Algorithm (0-100 pts)
                </h3>
                <p className="text-xs text-slate-400">
                  Every lead is programmatically evaluated across 4 objective 25-point vectors.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-200">Industry Alignment</span>
                  <span className="font-mono text-blue-400 font-bold">25 pts max</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  SaaS, Cloud Infrastructure, Healthcare, MedTech, FinTech &amp; Enterprise Services.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-200">Company Scale</span>
                  <span className="font-mono text-blue-400 font-bold">25 pts max</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Tiered by employee headcount (5-20, 20-100, 100-500, 500+ enterprise size).
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-200">Decision Makers</span>
                  <span className="font-mono text-blue-400 font-bold">25 pts max</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Presence of verified C-Suite, VP, Director, or Founder personnel.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-200">Email Deliverability</span>
                  <span className="font-mono text-blue-400 font-bold">25 pts max</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Real-time DNS MX server resolution, catching invalid or dead mail domains.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Infrastructure & Vault (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-purple-500/10 border border-purple-500/20 rounded-md text-purple-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Database Vault &amp; Persistence</h3>
                <p className="text-xs text-slate-400">Local embedded SQLite via Prisma ORM.</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-purple-400" />
                  <span>Storage Engine</span>
                </span>
                <span className="font-mono text-purple-300">SQLite (Zero Setup)</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  <span>Authentication</span>
                </span>
                <span className="font-mono text-emerald-300">JWT + Bcrypt (10 rounds)</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span>Concurrency &amp; Limits</span>
                </span>
                <span className="font-mono text-blue-300">p-limit / Bottleneck</span>
              </div>
            </div>
          </div>

          {/* Connected Providers Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Registered Providers Status</span>
            </h3>

            <div className="space-y-2 text-xs">
              {providers.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-white">{p.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {p.rateLimit}
                    </div>
                  </div>
                  {p.isDeferred ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Deferred
                    </span>
                  ) : p.hasKey ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Ready
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Needs Key
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
