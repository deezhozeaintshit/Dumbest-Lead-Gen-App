import React, { useState } from 'react';
import {
  X,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Key,
  Globe,
  Loader2,
  Zap,
  Building2,
  MapPin,
  MailCheck,
  FileSpreadsheet,
} from 'lucide-react';
import axios from 'axios';
import { ProviderInfo } from '../types.js';

interface ApiAdaptersModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: ProviderInfo[];
}

interface TestResult {
  status: 'ONLINE' | 'NEEDS_KEY' | 'ERROR';
  latencyMs: number;
  sampleItem?: string;
  totalAvailable?: number;
  message?: string;
}

export const ApiAdaptersModal: React.FC<ApiAdaptersModalProps> = ({
  isOpen,
  onClose,
  providers,
}) => {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

  if (!isOpen) return null;

  const handleTestConnection = async (providerId: string) => {
    setTestingId(providerId);
    try {
      const res = await axios.post(`/api/providers/${providerId}/test`);
      setTestResults((prev) => ({
        ...prev,
        [providerId]: res.data,
      }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [providerId]: {
          status: 'ERROR',
          latencyMs: 0,
          message: err.response?.data?.error || err.message || 'Connection failed',
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const getProviderIcon = (id: string) => {
    switch (id) {
      case 'sec_edgar':
        return <Building2 className="w-5 h-5 text-blue-400" />;
      case 'osm_commercial':
        return <MapPin className="w-5 h-5 text-emerald-400" />;
      case 'google_places':
        return <Globe className="w-5 h-5 text-amber-400" />;
      case 'b2b_contacts':
        return <MailCheck className="w-5 h-5 text-purple-400" />;
      case 'csv_import':
        return <FileSpreadsheet className="w-5 h-5 text-cyan-400" />;
      default:
        return <Layers className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        id="api-adapters-modal"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">External API Adapters &amp; Live Feeds</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every provider connects to real external APIs and live registries. SEC EDGAR and OpenStreetMap are public and 100% active with zero API keys needed.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            id="close-adapters-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center space-x-2.5 text-xs text-blue-300">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              <strong>Production Ready Without Google Places:</strong> SEC EDGAR and OpenStreetMap live feeds operate with zero billing and zero setup. Google Places is optional and can wait until bank verification completes.
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {providers.map((p) => {
              const result = testResults[p.id];
              const isTesting = testingId === p.id;
              const isDeferred = p.isDeferred || (p.id === 'google_places' && !p.hasKey);

              return (
                <div
                  key={p.id}
                  className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 transition-all hover:border-slate-700"
                  id={`adapter-card-${p.id}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-slate-900 border border-slate-800 rounded-md shrink-0 mt-0.5">
                        {getProviderIcon(p.id)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-semibold text-slate-200">{p.name}</h3>
                          {p.hasKey ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{p.requiresKey ? 'Key Configured' : 'Public Active'}</span>
                            </span>
                          ) : isDeferred ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              <span>Optional • Awaiting Bank Verification</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Key className="w-3 h-3" />
                              <span>Requires API Key</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{p.description}</p>

                        {p.requiresKey && (
                          <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center gap-2">
                            <span>
                              Env Variable:{' '}
                              <span className="text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                {p.keyEnvVar}
                              </span>
                            </span>
                            {isDeferred && (
                              <span className="text-slate-500 text-[10px] font-sans">
                                (Optional — can wait for bank verification)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center sm:self-center shrink-0">
                      <button
                        onClick={() => handleTestConnection(p.id)}
                        disabled={isTesting}
                        className="w-full sm:w-auto px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors border border-slate-700 disabled:opacity-50"
                        id={`test-adapter-${p.id}`}
                      >
                        {isTesting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Pinging...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 text-blue-400" />
                            <span>{isDeferred ? 'Check Status' : 'Ping Live API'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Test Result Banner */}
                  {result && (
                    <div
                      className={`mt-3.5 p-3 rounded text-xs border ${
                        result.status === 'ONLINE'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : result.status === 'DEFERRED'
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                          : result.status === 'NEEDS_KEY'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-red-500/10 border-red-500/30 text-red-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-medium">
                        <span className="flex items-center space-x-1.5">
                          {result.status === 'ONLINE' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          {result.status === 'DEFERRED' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                          {result.status === 'NEEDS_KEY' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                          {result.status === 'ERROR' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                          <span>
                            {result.status === 'ONLINE'
                              ? `Live connection verified (${result.latencyMs}ms)`
                              : result.status === 'DEFERRED'
                              ? 'Optional Integration Deferred (Pending Bank Verification)'
                              : result.status === 'NEEDS_KEY'
                              ? 'Missing API Key'
                              : 'API Connection Error'}
                          </span>
                        </span>
                        {result.latencyMs > 0 && <span className="font-mono text-[11px]">{result.latencyMs} ms</span>}
                      </div>

                      {result.sampleItem && (
                        <p className="mt-1 text-[11px] opacity-90">
                          Sample verified entity: <span className="font-semibold">{result.sampleItem}</span>
                        </p>
                      )}
                      {result.message && <p className="mt-1 text-[11px] opacity-90">{result.message}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Zero mock data policy enforced across all ingestion pathways.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
