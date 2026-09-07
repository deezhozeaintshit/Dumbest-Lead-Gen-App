import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Award, CheckCircle2, ShieldCheck, TrendingUp, Layers, Users, Sparkles } from 'lucide-react';
import { ScoreBreakdown } from '../types.js';

interface ScoreBreakdownModalProps {
  leadId: string | null;
  onClose: () => void;
}

export const ScoreBreakdownModal: React.FC<ScoreBreakdownModalProps> = ({ leadId, onClose }) => {
  const [breakdown, setBreakdown] = useState<ScoreBreakdown | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!leadId) {
      setBreakdown(null);
      return;
    }

    const fetchBreakdown = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`/api/leads/${leadId}/score-breakdown`);
        setBreakdown(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load score breakdown');
      } finally {
        setLoading(false);
      }
    };

    fetchBreakdown();
  }, [leadId]);

  if (!leadId) return null;

  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'B':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'C':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        id="score-breakdown-modal"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Lead Scoring Engine</h2>
              <p className="text-xs text-slate-400 truncate max-w-[280px]">
                {breakdown?.businessName || 'Calculating metrics...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Evaluating scoring factors &amp; reachability metrics...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-950/40 border border-red-800/40 rounded-lg text-xs text-red-300">
              {error}
            </div>
          ) : breakdown ? (
            <>
              {/* Score Hero Summary */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Composite Lead Score</div>
                  <div className="flex items-baseline space-x-2 mt-0.5">
                    <span className="text-3xl font-bold text-slate-100">{breakdown.score}</span>
                    <span className="text-xs text-slate-500">/ 100</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-semibold ml-2 ${getGradeColor(
                        breakdown.grade
                      )}`}
                    >
                      {breakdown.grade} • {breakdown.tierLabel}
                    </span>
                  </div>
                </div>

                {/* Meter graphic */}
                <div className="w-14 h-14 relative flex items-center justify-center">
                  <div className="w-full h-full rounded-full border-4 border-slate-800 flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-200">{breakdown.score}%</span>
                  </div>
                </div>
              </div>

              {/* Factors Breakdown List */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Rule Evaluation Factors
                </h3>

                <div className="space-y-2 text-xs">
                  {breakdown.factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg flex items-start justify-between space-x-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-medium text-slate-200 flex items-center space-x-1.5">
                          <span>{factor.label}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            {factor.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{factor.description}</p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="font-bold text-emerald-400">+{factor.points}</span>
                        <span className="text-slate-500 text-[10px]"> / {factor.maxPoints}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
