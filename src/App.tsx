import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { AuthScreen } from './components/AuthScreen.js';
import { Sidebar } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { StatsBanner } from './components/StatsBanner.js';
import { IngestionControlPanel } from './components/IngestionControlPanel.js';
import { LeadTable } from './components/LeadTable.js';
import { LeadDetailModal } from './components/LeadDetailModal.js';
import { IngestionJob, Lead, PipelineStats, ProviderInfo } from './types.js';

function DashboardContent() {
  const { user, isLoading: authLoading } = useAuth();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'explorer' | 'jobs' | 'adapters' | 'settings'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedEmailStatus, setSelectedEmailStatus] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  // Sorting state (default: score desc)
  const [sortBy, setSortBy] = useState<string>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // UI state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchProviders = async () => {
    try {
      const res = await axios.get('/api/providers');
      setProviders(res.data.providers || []);
    } catch (err) {
      console.error('Failed to load providers', err);
    }
  };

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get('/api/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  }, [user]);

  const fetchJobs = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get('/api/jobs');
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error('Failed to load jobs', err);
    }
  }, [user]);

  const fetchLeads = useCallback(
    async (pageToFetch = currentPage) => {
      if (!user) return;
      try {
        const params: Record<string, any> = {
          page: pageToFetch,
          limit: 12,
          sortBy,
          sortOrder,
        };
        if (searchTerm) params.search = searchTerm;
        if (selectedState) params.state = selectedState;
        if (selectedIndustry) params.industry = selectedIndustry;
        if (selectedStatus) params.status = selectedStatus;
        if (selectedEmailStatus) params.emailStatus = selectedEmailStatus;
        if (selectedProvider) params.provider = selectedProvider;

        const res = await axios.get('/api/leads', { params });
        setLeads(res.data.leads || []);
        setTotalLeads(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } catch (err) {
        console.error('Failed to load leads', err);
      }
    },
    [user, currentPage, searchTerm, selectedState, selectedIndustry, selectedStatus, selectedEmailStatus, selectedProvider, sortBy, sortOrder]
  );

  const refreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStats(), fetchJobs(), fetchLeads()]);
    setIsRefreshing(false);
  };

  // Initial load when user is logged in
  useEffect(() => {
    fetchProviders();
    if (user) {
      fetchStats();
      fetchJobs();
      fetchLeads(1);
    }
  }, [user]);

  // Refetch leads when filters or sorting change
  useEffect(() => {
    if (user) {
      fetchLeads(1);
      setCurrentPage(1);
    }
  }, [searchTerm, selectedState, selectedIndustry, selectedStatus, selectedEmailStatus, selectedProvider, sortBy, sortOrder, user]);

  // Page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchLeads(newPage);
  };

  // Sort change handler
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Polling for active background jobs
  useEffect(() => {
    if (!user) return;
    const hasRunningJob = jobs.some((j) => j.status === 'RUNNING' || j.status === 'PENDING');
    if (!hasRunningJob) return;

    const interval = setInterval(() => {
      fetchJobs();
      fetchStats();
      fetchLeads(currentPage);
    }, 2500);

    return () => clearInterval(interval);
  }, [jobs, currentPage, user, fetchJobs, fetchStats, fetchLeads]);

  // Start Ingestion Job
  const handleStartIngest = async (params: {
    providerId: string;
    industry: string;
    city: string;
    state: string;
    zip: string;
    targetCount: number;
    autoEnrich: boolean;
  }) => {
    setIsIngesting(true);
    try {
      await axios.post('/api/ingest', {
        providerId: params.providerId,
        queryParams: {
          industry: params.industry,
          city: params.city,
          state: params.state,
          zip: params.zip,
        },
        targetCount: params.targetCount,
        autoEnrich: params.autoEnrich,
      });

      showToast(`Ingestion initialized! Target: ${params.targetCount} records`);
      await fetchJobs();
      await fetchStats();
      await fetchLeads(1);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to start ingestion job', 'error');
    } finally {
      setIsIngesting(false);
    }
  };

  // Enrich single lead
  const handleEnrichLead = async (leadId: string) => {
    setEnrichingId(leadId);
    try {
      const res = await axios.post(`/api/leads/${leadId}/enrich`);
      const updated = res.data.lead;
      if (updated) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
        if (selectedLead?.id === leadId) {
          setSelectedLead(updated);
        }
        showToast('Lead enriched with decision makers, score & email status!');
      }
      await fetchStats();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Enrichment failed', 'error');
    } finally {
      setEnrichingId(null);
    }
  };

  // Update lead status
  const handleUpdateStatus = async (leadId: string, newStatus: 'NEW' | 'CONTACTED' | 'ENRICHED') => {
    try {
      const res = await axios.patch(`/api/leads/${leadId}/status`, { status: newStatus });
      const updated = res.data.lead;
      if (updated) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
        if (selectedLead?.id === leadId) {
          setSelectedLead(updated);
        }
      }
      await fetchStats();
      showToast('Status updated and lead score recalculated');
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  // Delete lead
  const handleDeleteLead = async (leadId: string) => {
    try {
      await axios.delete(`/api/leads/${leadId}`);
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      if (selectedLead?.id === leadId) {
        setSelectedLead(null);
      }
      showToast('Lead removed from database');
      await fetchStats();
    } catch (err) {
      showToast('Failed to delete lead', 'error');
    }
  };

  // Bulk update lead statuses
  const handleBulkUpdateStatus = async (
    leadIds: string[],
    newStatus: 'NEW' | 'CONTACTED' | 'ENRICHED'
  ) => {
    try {
      const res = await axios.patch('/api/leads/bulk/status', {
        leadIds,
        status: newStatus,
      });
      showToast(res.data.message || `Updated ${leadIds.length} leads to ${newStatus}`);
      await fetchLeads(currentPage);
      await fetchStats();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update leads in bulk', 'error');
    }
  };

  // Bulk delete leads
  const handleBulkDelete = async (leadIds: string[]) => {
    try {
      const res = await axios.post('/api/leads/bulk/delete', { leadIds });
      showToast(res.data.message || `Deleted ${leadIds.length} leads`);
      if (selectedLead && leadIds.includes(selectedLead.id)) {
        setSelectedLead(null);
      }
      await fetchLeads(currentPage);
      await fetchStats();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete leads in bulk', 'error');
    }
  };

  // Export to CSV
  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedState) params.append('state', selectedState);
      if (selectedIndustry) params.append('industry', selectedIndustry);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedEmailStatus) params.append('emailStatus', selectedEmailStatus);
      if (selectedProvider) params.append('provider', selectedProvider);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const token = localStorage.getItem('lead_pipeline_jwt');
      const downloadUrl = `/api/export/csv?${params.toString()}${token ? `&token=${token}` : ''}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `leads_scored_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('CSV export with scores & email health downloaded!');
    } catch (err) {
      showToast('Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Seed sample records
  const handleSeedSample = async () => {
    setIsSeeding(true);
    try {
      await axios.post('/api/seed');
      showToast('Sample B2B leads seeded with scores & verified emails!');
      await refreshAll();
    } catch (err) {
      showToast('Failed to seed sample leads', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedState('');
    setSelectedIndustry('');
    setSelectedStatus('');
    setSelectedEmailStatus('');
    setSelectedProvider('');
  };

  // If waiting for auth initialization
  if (authLoading) {
    return (
      <div className="h-screen w-full bg-[#09090B] flex items-center justify-center text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono">Initializing JWT Security Gate...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show modern login / register screen
  if (!user) {
    return <AuthScreen />;
  }

  const activeJobsCount = jobs.filter((j) => j.status === 'RUNNING' || j.status === 'PENDING').length;

  return (
    <div className="h-screen w-full bg-[#09090B] text-slate-200 font-sans flex antialiased select-none overflow-hidden">
      {/* Toast notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-2.5 rounded-lg shadow-xl border text-xs font-medium flex items-center space-x-2 ${
              notification.type === 'error'
                ? 'bg-red-950 text-red-200 border-red-800'
                : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}
          >
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        activeJobsCount={activeJobsCount}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#09090B] h-full overflow-hidden">
        {/* Header */}
        <Header
          onRefresh={refreshAll}
          isRefreshing={isRefreshing}
          onSeedSample={handleSeedSample}
          isSeeding={isSeeding}
          totalLeads={stats?.totalLeads || 0}
          activeJobsCount={activeJobsCount}
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          onExportCsv={handleExportCsv}
          isExporting={isExporting}
        />

        {/* Dynamic Content Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Main Work Area: 8 columns */}
          <section className="lg:col-span-8 p-4 sm:p-6 overflow-y-auto flex flex-col min-h-0 space-y-6">
            {/* KPI Metrics */}
            <StatsBanner
              stats={stats}
              onExportCsv={handleExportCsv}
              isExporting={isExporting}
            />

            {/* Lead Directory Table */}
            <div className="flex-1 flex flex-col min-h-0">
              <LeadTable
                leads={leads}
                totalLeads={totalLeads}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedState={selectedState}
                onStateChange={setSelectedState}
                selectedIndustry={selectedIndustry}
                onIndustryChange={setSelectedIndustry}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                selectedEmailStatus={selectedEmailStatus}
                onEmailStatusChange={setSelectedEmailStatus}
                selectedProvider={selectedProvider}
                onProviderChange={setSelectedProvider}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                availableStates={stats?.availableStates || []}
                availableIndustries={stats?.availableIndustries || []}
                onSelectLead={(lead) => setSelectedLead(lead)}
                onEnrichLead={handleEnrichLead}
                onUpdateStatus={handleUpdateStatus}
                onDeleteLead={handleDeleteLead}
                onBulkUpdateStatus={handleBulkUpdateStatus}
                onBulkDelete={handleBulkDelete}
                enrichingId={enrichingId}
                onResetFilters={handleResetFilters}
              />
            </div>
          </section>

          {/* Right Aside: 4 columns - Ingestion Control Panel & Job Monitor */}
          <aside className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-800 bg-[#0C0C0E] p-4 sm:p-6 space-y-6 overflow-y-auto min-h-0">
            <IngestionControlPanel
              providers={providers}
              jobs={jobs}
              onStartIngest={handleStartIngest}
              isIngesting={isIngesting}
            />
          </aside>
        </div>
      </main>

      {/* Lead Detail Slide-over Modal */}
      <LeadDetailModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onEnrichLead={handleEnrichLead}
        onUpdateStatus={handleUpdateStatus}
        onLeadUpdated={(updatedLead) => {
          setSelectedLead(updatedLead);
          setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
        }}
        isEnriching={enrichingId === selectedLead?.id}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
