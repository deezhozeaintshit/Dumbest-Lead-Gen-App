import React, { useState, useMemo } from 'react';
import {
  Compass,
  Search,
  Layers,
  ArrowRight,
  Sparkles,
  Briefcase,
  CheckCircle2,
  Play,
  Filter,
  ExternalLink,
} from 'lucide-react';
import {
  BUSINESS_TAXONOMY,
  BusinessCategory,
} from '../data/businessTaxonomy.js';

interface NichesViewProps {
  onSelectNicheForIngest: (subNiche: string, categoryId: string) => void;
  onFilterLeadsByNiche: (nicheName: string) => void;
}

export const NichesView: React.FC<NichesViewProps> = ({
  onSelectNicheForIngest,
  onFilterLeadsByNiche,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  const totalCategories = BUSINESS_TAXONOMY.length;
  const totalSubNiches = useMemo(
    () => BUSINESS_TAXONOMY.reduce((acc, cat) => acc + cat.subNiches.length, 0),
    []
  );

  // Filtered categories and sub-niches
  const filteredCategories = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return BUSINESS_TAXONOMY.filter((cat) => {
      if (activeCategoryFilter !== 'all' && cat.id !== activeCategoryFilter) {
        return false;
      }

      if (!q) return true;

      const matchesCatName = cat.name.toLowerCase().includes(q);
      const matchesCode = cat.code.toLowerCase().includes(q);
      const matchesDesc = cat.description.toLowerCase().includes(q);
      const matchesSub = cat.subNiches.some((s) => s.toLowerCase().includes(q));

      return matchesCatName || matchesCode || matchesDesc || matchesSub;
    }).map((cat) => {
      if (!q) return cat;

      // Filter subniches within category if searching
      const filteredSubs = cat.subNiches.filter((s) =>
        s.toLowerCase().includes(q)
      );

      return {
        ...cat,
        subNiches: filteredSubs.length > 0 ? filteredSubs : cat.subNiches,
      };
    });
  }, [searchTerm, activeCategoryFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto flex-1 min-h-0" id="niches-page-container">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Business Niches &amp; Category Directory
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono font-semibold">
                {totalCategories} Categories • {totalSubNiches}+ Sub-Niches
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Production B2B taxonomy engineered for targeted pipeline ingestion and high-conversion market segmentation.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>440+ Commercial Verticals</span>
          </span>
        </div>
      </div>

      {/* Search & Quick Category Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search across all 44 categories and 440+ sub-niches (e.g., 'Cybersecurity', 'HVAC', 'SaaS', 'Dentistry', 'Logistics')..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              id="search-taxonomy-input"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={activeCategoryFilter}
            onChange={(e) => setActiveCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-200 outline-none focus:border-blue-500 min-w-[200px]"
            id="select-category-filter"
          >
            <option value="all">All 44 Categories ({totalSubNiches}+ Sub-Niches)</option>
            {BUSINESS_TAXONOMY.map((cat) => (
              <option key={cat.id} value={cat.id}>
                [{cat.code}] {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1 text-slate-400">
          <span className="font-semibold text-slate-500 flex items-center space-x-1 shrink-0">
            <Filter className="w-3 h-3" />
            <span>Popular:</span>
          </span>
          {['Cybersecurity & Threat Intelligence', 'Commercial HVAC & Climate Control', 'Private Equity & Venture Capital', 'Clinical Research Organizations (CRO)', 'Third-Party Logistics (3PL)', 'Commercial Solar Photovoltaic (PV)'].map(
            (popular) => (
              <button
                key={popular}
                onClick={() => setSearchTerm(popular)}
                className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 hover:border-blue-500/40 hover:text-white shrink-0 transition-colors"
              >
                {popular}
              </button>
            )
          )}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white text-[10px] shrink-0"
            >
              Clear Search
            </button>
          )}
        </div>
      </div>

      {/* Categories & Sub-Niches Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {filteredCategories.length} of {totalCategories} categories
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
              id={`category-card-${category.id}`}
            >
              <div className="space-y-3">
                {/* Category Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold">
                        {category.code}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                        {category.name}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {category.description}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800 shrink-0">
                    {category.subNiches.length} Niches
                  </span>
                </div>

                {/* Sub-Niches Badges Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {category.subNiches.map((sub, idx) => (
                    <div
                      key={`${category.id}-${idx}`}
                      className="p-2.5 bg-slate-950 border border-slate-800/90 rounded-lg flex items-center justify-between group hover:border-blue-500/40 hover:bg-slate-800/40 transition-all text-xs"
                    >
                      <div className="flex items-center space-x-2 truncate mr-2">
                        <span className="w-4 h-4 rounded-full bg-slate-900 border border-slate-800 text-[9px] font-mono text-slate-500 flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-slate-300 group-hover:text-white truncate font-medium">
                          {sub}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => onSelectNicheForIngest(sub, category.id)}
                          title={`Ingest leads in ${sub}`}
                          className="p-1 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white transition-colors"
                        >
                          <Play className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onFilterLeadsByNiche(sub)}
                          title={`Search database leads for ${sub}`}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        >
                          <Search className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer Quick Action */}
              <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  <span>Click <Play className="w-2.5 h-2.5 inline mx-0.5 text-blue-400" /> to launch scrape</span>
                </span>
                <button
                  onClick={() => onSelectNicheForIngest(category.subNiches[0], category.id)}
                  className="text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
                >
                  <span>Target Category</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
