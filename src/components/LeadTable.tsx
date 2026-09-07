import React, { useState } from 'react';
import {
  Search,
  ExternalLink,
  Mail,
  Linkedin,
  Sparkles,
  Eye,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  Send,
  Building,
  ChevronLeft,
  ChevronRight,
  FilterX,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Award,
  CheckSquare,
  Square,
  Loader2,
} from 'lucide-react';
import { Lead, EmailStatus } from '../types.js';
import { ScoreBreakdownModal } from './ScoreBreakdownModal.js';
import { BUSINESS_TAXONOMY } from '../data/businessTaxonomy.js';

interface LeadTableProps {
  leads: Lead[];
  totalLeads: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  searchTerm: string;
  onSearchChange: (search: string) => void;
  selectedState: string;
  onStateChange: (state: string) => void;
  selectedIndustry: string;
  onIndustryChange: (ind: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedEmailStatus: string;
  onEmailStatusChange: (status: string) => void;
  selectedProvider: string;
  onProviderChange: (prov: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: string) => void;
  availableStates: string[];
  availableIndustries: string[];
  onSelectLead: (lead: Lead) => void;
  onEnrichLead: (leadId: string) => Promise<void>;
  onUpdateStatus: (leadId: string, newStatus: 'NEW' | 'CONTACTED' | 'ENRICHED') => Promise<void>;
  onDeleteLead: (leadId: string) => Promise<void>;
  onBulkUpdateStatus?: (leadIds: string[], newStatus: 'NEW' | 'CONTACTED' | 'ENRICHED') => Promise<void>;
  onBulkDelete?: (leadIds: string[]) => Promise<void>;
  enrichingId: string | null;
  onResetFilters: () => void;
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  totalLeads,
  currentPage,
  totalPages,
  onPageChange,
  searchTerm,
  onSearchChange,
  selectedState,
  onStateChange,
  selectedIndustry,
  onIndustryChange,
  selectedStatus,
  onStatusChange,
  selectedEmailStatus,
  onEmailStatusChange,
  selectedProvider,
  onProviderChange,
  sortBy,
  sortOrder,
  onSortChange,
  availableStates,
  availableIndustries,
  onSelectLead,
  onEnrichLead,
  onUpdateStatus,
  onDeleteLead,
  onBulkUpdateStatus,
  onBulkDelete,
  enrichingId,
  onResetFilters,
}) => {
  const [inspectingScoreLeadId, setInspectingScoreLeadId] = useState<string | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const headerCheckboxRef = React.useRef<HTMLInputElement>(null);

  const allCurrentPageSelected =
    leads.length > 0 && leads.every((l) => selectedLeadIds.includes(l.id));
  const someCurrentPageSelected =
    leads.some((l) => selectedLeadIds.includes(l.id)) && !allCurrentPageSelected;

  React.useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someCurrentPageSelected;
    }
  }, [someCurrentPageSelected]);

  const toggleSelectAll = () => {
    if (allCurrentPageSelected) {
      setSelectedLeadIds((prev) => prev.filter((id) => !leads.some((l) => l.id === id)));
    } else {
      const newIds = new Set([...selectedLeadIds, ...leads.map((l) => l.id)]);
      setSelectedLeadIds(Array.from(newIds));
    }
  };

  const toggleSelectLead = (id: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectedLeadIds([]);
  };

  const handleBulkStatusChange = async (newStatus: 'NEW' | 'CONTACTED' | 'ENRICHED') => {
    if (!onBulkUpdateStatus || selectedLeadIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      await onBulkUpdateStatus(selectedLeadIds, newStatus);
      clearSelection();
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (!onBulkDelete || selectedLeadIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      await onBulkDelete(selectedLeadIds);
      clearSelection();
      setConfirmDeleteOpen(false);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const hasActiveFilters = Boolean(
    searchTerm || selectedState || selectedIndustry || selectedStatus || selectedEmailStatus || selectedProvider
  );

  const getScoreBadge = (score: number) => {
    if (score >= 85) {
      return {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        bar: 'bg-emerald-500',
        tier: 'Tier 1',
      };
    }
    if (score >= 65) {
      return {
        bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        bar: 'bg-blue-500',
        tier: 'Tier 2',
      };
    }
    if (score >= 40) {
      return {
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        bar: 'bg-amber-500',
        tier: 'Tier 3',
      };
    }
    return {
      bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      bar: 'bg-slate-500',
      tier: 'Nurture',
    };
  };

  const getEmailStatusBadge = (status: EmailStatus) => {
    switch (status) {
      case 'VALID':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>VALID</span>
          </span>
        );
      case 'INVALID':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-medium">
            <XCircle className="w-3 h-3 text-red-400 shrink-0" />
            <span>INVALID</span>
          </span>
        );
      case 'RISKY':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-medium">
            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
            <span>RISKY</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[10px] font-medium">
            <HelpCircle className="w-3 h-3 text-slate-500 shrink-0" />
            <span>UNKNOWN</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col shadow-sm">
      {/* Top Search & Filter Bar */}
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/90 flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search company, domain, contact..."
              className="w-full bg-slate-950 border border-slate-700 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500"
              id="search-leads-input"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
          {/* Email Status Filter */}
          <select
            value={selectedEmailStatus}
            onChange={(e) => onEmailStatusChange(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500"
            id="filter-email-status"
          >
            <option value="">All Email Health</option>
            <option value="VALID">Valid Email</option>
            <option value="RISKY">Risky / Catch-all</option>
            <option value="INVALID">Invalid Email</option>
            <option value="UNKNOWN">Unvalidated</option>
          </select>

          {/* Lead Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500"
            id="filter-status"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="ENRICHED">Enriched</option>
          </select>

          {/* Industry Filter */}
          <select
            value={selectedIndustry}
            onChange={(e) => onIndustryChange(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500 max-w-[170px] truncate"
            id="filter-industry"
          >
            <option value="">All Industries</option>
            {availableIndustries.length > 0 && (
              <optgroup label="Database Industries">
                {availableIndustries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="44 B2B Categories">
              {BUSINESS_TAXONOMY.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </optgroup>
          </select>

          {/* State Filter */}
          <select
            value={selectedState}
            onChange={(e) => onStateChange(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500"
            id="filter-state"
          >
            <option value="">All States</option>
            {availableStates.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Sort Controller */}
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs">
            <span className="text-slate-400 text-[11px]">Sort:</span>
            <button
              onClick={() => onSortChange('score')}
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium flex items-center space-x-0.5 ${
                sortBy === 'score' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Score</span>
              {sortBy === 'score' && (
                sortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
              )}
            </button>
            <button
              onClick={() => onSortChange('business_name')}
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium flex items-center space-x-0.5 ${
                sortBy === 'business_name' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Name</span>
              {sortBy === 'business_name' && (
                sortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
              )}
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              title="Reset Filters"
              id="reset-filters-btn"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedLeadIds.length > 0 && (
        <div className="bg-blue-950/40 border-y border-blue-500/30 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-blue-300 flex items-center space-x-1.5">
              <CheckSquare className="w-4 h-4 text-blue-400" />
              <span>{selectedLeadIds.length} lead{selectedLeadIds.length > 1 ? 's' : ''} selected</span>
            </span>
            <button
              onClick={clearSelection}
              disabled={isBulkProcessing}
              className="text-slate-400 hover:text-white underline text-[11px] disabled:opacity-50"
            >
              Deselect all
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400 text-[11px] hidden sm:inline">Bulk Status:</span>
            <button
              onClick={() => handleBulkStatusChange('NEW')}
              disabled={isBulkProcessing}
              className="px-2.5 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-[11px] font-medium transition-colors disabled:opacity-50"
              title="Mark selected leads as NEW"
            >
              Mark New
            </button>
            <button
              onClick={() => handleBulkStatusChange('CONTACTED')}
              disabled={isBulkProcessing}
              className="px-2.5 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-[11px] font-medium transition-colors disabled:opacity-50"
              title="Mark selected leads as CONTACTED"
            >
              Mark Contacted
            </button>
            <button
              onClick={() => handleBulkStatusChange('ENRICHED')}
              disabled={isBulkProcessing}
              className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium transition-colors disabled:opacity-50"
              title="Mark selected leads as ENRICHED"
            >
              Mark Enriched
            </button>

            <div className="h-4 w-px bg-slate-700 mx-1" />

            <button
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={isBulkProcessing}
              className="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-[11px] font-medium flex items-center space-x-1 transition-colors disabled:opacity-50"
              title="Delete all selected leads"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete ({selectedLeadIds.length})</span>
            </button>

            {isBulkProcessing && (
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin ml-1" />
            )}
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-black/20 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-800 select-none">
            <tr>
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  ref={headerCheckboxRef}
                  checked={allCurrentPageSelected}
                  onChange={toggleSelectAll}
                  disabled={leads.length === 0}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer transition-colors disabled:opacity-30"
                  aria-label="Select all leads on current page"
                />
              </th>
              <th className="py-3 px-5 font-semibold">Business</th>
              <th
                className="py-3 px-5 font-semibold cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => onSortChange('score')}
              >
                <div className="flex items-center space-x-1">
                  <span>Score</span>
                  {sortBy === 'score' ? (
                    sortOrder === 'desc' ? (
                      <ArrowDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ArrowUp className="w-3 h-3 text-blue-400" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>
              <th className="py-3 px-5 font-semibold">Email Deliverability</th>
              <th className="py-3 px-5 font-semibold">Decision Maker</th>
              <th className="py-3 px-5 font-semibold">Status</th>
              <th className="py-3 px-5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <Building className="w-8 h-8 text-slate-600 mb-2" />
                    <p className="font-medium text-slate-300">No leads found matching criteria</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {hasActiveFilters
                        ? 'Try clearing active search filters to view all stored leads.'
                        : 'Run an ingestion pipeline above or click Load Sample Leads.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const primaryContact = lead.contacts?.[0];
                const isEnriching = enrichingId === lead.id;
                const scoreMeta = getScoreBadge(lead.score || 0);
                const isSelected = selectedLeadIds.includes(lead.id);

                return (
                  <tr
                    key={lead.id}
                    className={`transition-colors group cursor-pointer ${
                      isSelected ? 'bg-blue-950/20 hover:bg-blue-900/30 border-l-2 border-l-blue-500' : 'hover:bg-slate-800/30'
                    }`}
                    onClick={() => onSelectLead(lead)}
                  >
                    {/* Row Select Checkbox */}
                    <td className="py-3.5 px-3 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelectLead(lead.id, e)}
                        className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer transition-colors"
                        aria-label={`Select ${lead.business_name}`}
                      />
                    </td>

                    {/* Business Name & Domain */}
                    <td className="py-3.5 px-5 max-w-[200px]">
                      <div className="font-medium text-slate-200 truncate group-hover:text-blue-400 transition-colors">
                        {lead.business_name}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {lead.domain || lead.website || lead.city || 'No domain'}
                        {lead.industry ? ` • ${lead.industry}` : ''}
                      </div>
                    </td>

                    {/* Lead Score */}
                    <td
                      className="py-3.5 px-5 whitespace-nowrap"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectingScoreLeadId(lead.id);
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`px-2 py-0.5 rounded-md border text-xs font-bold font-mono flex items-center space-x-1 cursor-pointer hover:ring-1 hover:ring-blue-400 ${scoreMeta.bg}`}
                          title="Click to view full scoring breakdown"
                        >
                          <Award className="w-3 h-3" />
                          <span>{lead.score || 0}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{scoreMeta.tier}</span>
                      </div>
                    </td>

                    {/* Email Deliverability Status */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="flex flex-col space-y-0.5">
                        <div className="text-xs text-slate-300 truncate max-w-[170px]">
                          {lead.email || primaryContact?.email || 'No email on file'}
                        </div>
                        <div>{getEmailStatusBadge(lead.email_status)}</div>
                      </div>
                    </td>

                    {/* Decision Maker */}
                    <td className="py-3.5 px-5 max-w-[190px] text-xs">
                      {primaryContact ? (
                        <div>
                          <div className="font-medium text-slate-200 truncate">
                            {primaryContact.first_name} {primaryContact.last_name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {primaryContact.title || 'Executive'}
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-500 text-[11px] italic">Pending enrichment</div>
                      )}
                    </td>

                    {/* Lead Status */}
                    <td className="py-3.5 px-5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setInspectingScoreLeadId(lead.id)}
                          className="p-1.5 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                          title="Score Breakdown"
                        >
                          <Award className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectLead(lead)}
                          className="p-1.5 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {lead.status !== 'ENRICHED' && (
                          <button
                            onClick={() => onEnrichLead(lead.id)}
                            disabled={isEnriching}
                            className="p-1.5 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors disabled:opacity-40"
                            title="Enrich Lead"
                          >
                            <Sparkles className={`w-3.5 h-3.5 ${isEnriching ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteLead(lead.id)}
                          className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing <span className="font-semibold text-slate-200">{leads.length}</span> of{' '}
          <span className="font-semibold text-slate-200">{totalLeads}</span> leads
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage <= 1}
            className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-colors"
            id="prev-page-btn"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px]">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-colors"
            id="next-page-btn"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Score Inspection Modal */}
      <ScoreBreakdownModal
        leadId={inspectingScoreLeadId}
        onClose={() => setInspectingScoreLeadId(null)}
      />

      {/* Bulk Delete Confirmation Dialog */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-400">
              <div className="p-2 rounded-lg bg-red-950/60 border border-red-800/60">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">
                Delete {selectedLeadIds.length} Selected Lead{selectedLeadIds.length > 1 ? 's' : ''}?
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This action will permanently delete <span className="font-semibold text-white">{selectedLeadIds.length}</span> lead{selectedLeadIds.length > 1 ? 's' : ''} and all corresponding contacts from your pipeline database. This operation cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setConfirmDeleteOpen(false)}
                disabled={isBulkProcessing}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                disabled={isBulkProcessing}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white flex items-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                {isBulkProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete Leads</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
