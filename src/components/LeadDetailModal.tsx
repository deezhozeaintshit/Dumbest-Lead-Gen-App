import React, { useState } from 'react';
import axios from 'axios';
import {
  X,
  Building,
  Globe,
  Phone,
  Mail,
  MapPin,
  Users,
  DollarSign,
  Sparkles,
  ExternalLink,
  Linkedin,
  ShieldCheck,
  Calendar,
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { Lead, EmailStatus } from '../types.js';
import { ScoreBreakdownModal } from './ScoreBreakdownModal.js';

interface LeadDetailModalProps {
  lead: Lead | null;
  onClose: () => void;
  onEnrichLead: (leadId: string) => Promise<void>;
  onUpdateStatus: (leadId: string, newStatus: 'NEW' | 'CONTACTED' | 'ENRICHED') => Promise<void>;
  onLeadUpdated?: (updatedLead: Lead) => void;
  isEnriching: boolean;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  onClose,
  onEnrichLead,
  onUpdateStatus,
  onLeadUpdated,
  isEnriching,
}) => {
  const [isValidatingEmail, setIsValidatingEmail] = useState<boolean>(false);
  const [showScoreModal, setShowScoreModal] = useState<boolean>(false);
  const [validationNote, setValidationNote] = useState<string | null>(null);

  if (!lead) return null;

  const handleValidateEmail = async () => {
    setIsValidatingEmail(true);
    setValidationNote(null);
    try {
      const res = await axios.post(`/api/leads/${lead.id}/validate-email`, {
        email: lead.email || (lead.contacts && lead.contacts[0]?.email),
      });

      setValidationNote(res.data.validation?.reason || `Status: ${res.data.validation?.status}`);
      if (onLeadUpdated && res.data.lead) {
        onLeadUpdated(res.data.lead);
      }
    } catch (err: any) {
      setValidationNote(err.response?.data?.error || 'Validation failed');
    } finally {
      setIsValidatingEmail(false);
    }
  };

  const getEmailStatusBadge = (status: EmailStatus) => {
    switch (status) {
      case 'VALID':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>VERIFIED VALID</span>
          </span>
        );
      case 'INVALID':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold">
            <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>INVALID / BOUNCE RISK</span>
          </span>
        );
      case 'RISKY':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>RISKY / CATCH-ALL</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>UNVALIDATED</span>
          </span>
        );
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
        onClick={onClose}
      >
        <div
          className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
          id="lead-detail-modal"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-900">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded bg-blue-600/10 border border-blue-500/20 flex items-center justify-center font-bold text-blue-400 text-base shrink-0">
                {lead.business_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-slate-100 tracking-tight">{lead.business_name}</h2>
                  {lead.status === 'ENRICHED' && (
                    <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] border border-green-500/20 font-medium">
                      ENRICHED
                    </span>
                  )}
                  {lead.status === 'NEW' && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] border border-blue-500/20 font-medium">
                      NEW
                    </span>
                  )}
                  {lead.status === 'CONTACTED' && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] border border-purple-500/20 font-medium">
                      CONTACTED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lead.legal_name || `${lead.business_name} Corporation`}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              id="close-modal-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body content */}
          <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Top Cards: Lead Score & Email Deliverability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Lead Score Card */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-medium">
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Lead Score</span>
                  </div>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <span className="text-2xl font-bold text-slate-100">{lead.score || 0}</span>
                    <span className="text-xs text-slate-500">/ 100</span>
                  </div>
                  <button
                    onClick={() => setShowScoreModal(true)}
                    className="text-[11px] text-blue-400 hover:underline mt-1 block font-medium"
                  >
                    View Score Breakdown &rarr;
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    {lead.score >= 85 ? 'Tier 1 Priority' : lead.score >= 65 ? 'Tier 2 High' : 'Tier 3 Standard'}
                  </span>
                </div>
              </div>

              {/* Email Deliverability Card */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-medium">
                      <Mail className="w-3.5 h-3.5 text-blue-400" />
                      <span>Email Health</span>
                    </div>
                    {getEmailStatusBadge(lead.email_status)}
                  </div>
                  <div className="text-xs text-slate-300 font-mono truncate">
                    {lead.email || (lead.contacts && lead.contacts[0]?.email) || 'No email attached'}
                  </div>
                  {validationNote && (
                    <p className="text-[11px] text-slate-400 mt-1 truncate">{validationNote}</p>
                  )}
                </div>

                <div className="mt-2 text-right">
                  <button
                    onClick={handleValidateEmail}
                    disabled={isValidatingEmail || (!lead.email && !lead.contacts?.[0]?.email)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded text-xs font-medium transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${isValidatingEmail ? 'animate-spin' : ''}`} />
                    <span>{isValidatingEmail ? 'Validating...' : 'Validate Email'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Key Attributes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded p-3 space-y-1.5">
                <div className="flex items-center space-x-2 text-slate-400">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-medium text-slate-300">Website &amp; Domain</span>
                </div>
                {lead.domain ? (
                  <a
                    href={`https://${lead.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline flex items-center space-x-1"
                  >
                    <span>{lead.domain}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <p className="text-slate-500">Unspecified</p>
                )}
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded p-3 space-y-1.5">
                <div className="flex items-center space-x-2 text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-medium text-slate-300">Corporate Phone</span>
                </div>
                <p className="text-slate-200">{lead.phone || 'Not available'}</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded p-3 space-y-1.5">
                <div className="flex items-center space-x-2 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span className="font-medium text-slate-300">Headquarters</span>
                </div>
                <p className="text-slate-200">
                  {[lead.street, lead.city, lead.state, lead.zip].filter(Boolean).join(', ') || 'N/A'}
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded p-3 space-y-1.5">
                <div className="flex items-center space-x-2 text-slate-400">
                  <Building className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-medium text-slate-300">Industry &amp; Scale</span>
                </div>
                <p className="text-slate-200">
                  {lead.industry || 'B2B'} • {lead.employee_count ? `${lead.employee_count} Employees` : 'Private'}
                </p>
              </div>
            </div>

            {/* Decision Makers & Contacts Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Associated Decision Makers ({lead.contacts?.length || 0})
                  </h3>
                </div>
                {lead.status !== 'ENRICHED' && (
                  <button
                    onClick={() => onEnrichLead(lead.id)}
                    disabled={isEnriching}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <Sparkles className={`w-3 h-3 ${isEnriching ? 'animate-spin' : ''}`} />
                    <span>{isEnriching ? 'Enriching...' : 'Enrich Lead'}</span>
                  </button>
                )}
              </div>

              {lead.contacts && lead.contacts.length > 0 ? (
                <div className="space-y-2">
                  {lead.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-3 bg-slate-950 border border-slate-800 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-medium text-slate-200 text-xs">
                          {contact.first_name} {contact.last_name}
                        </div>
                        <div className="text-[11px] text-slate-400">{contact.title || 'Decision Maker'}</div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-blue-400 hover:underline flex items-center space-x-1 text-[11px]"
                          >
                            <Mail className="w-3 h-3" />
                            <span>{contact.email}</span>
                          </a>
                        )}
                        {contact.linkedin_url && (
                          <a
                            href={contact.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-white flex items-center space-x-1 text-[11px]"
                          >
                            <Linkedin className="w-3 h-3 text-blue-500" />
                            <span>LinkedIn</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-950 border border-slate-800/60 rounded text-center text-xs text-slate-500">
                  No decision makers on file yet. Click &quot;Enrich Lead&quot; to fetch executive profiles.
                </div>
              )}
            </div>

            {/* Ingestion Metadata & Audit */}
            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-3">
                <span>
                  Source: <strong className="text-slate-400 capitalize">{lead.source_provider}</strong>
                </span>
                <span>•</span>
                <span>ID: {lead.id.slice(0, 8)}...</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>Updated: {new Date(lead.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Engagement:</span>
              <select
                value={lead.status}
                onChange={(e) => onUpdateStatus(lead.id, e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-blue-500"
              >
                <option value="NEW">NEW</option>
                <option value="CONTACTED">CONTACTED</option>
                <option value="ENRICHED">ENRICHED</option>
              </select>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Score Modal */}
      {showScoreModal && (
        <ScoreBreakdownModal leadId={lead.id} onClose={() => setShowScoreModal(false)} />
      )}
    </>
  );
};
