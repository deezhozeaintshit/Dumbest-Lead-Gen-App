import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Check,
  Layers,
  Sparkles,
  ArrowRight,
  Filter,
  Briefcase,
} from 'lucide-react';
import {
  BUSINESS_TAXONOMY,
  BusinessCategory,
} from '../data/businessTaxonomy.js';

interface NicheSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNiche: (subNiche: string, categoryName: string) => void;
  currentNiche?: string;
}

export const NicheSelectorModal: React.FC<NicheSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectNiche,
  currentNiche,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    BUSINESS_TAXONOMY[0].id
  );

  // Filter categories and subniches based on search query
  const searchResults = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return null;

    const matchedItems: { category: BusinessCategory; subNiche: string }[] = [];
    for (const cat of BUSINESS_TAXONOMY) {
      for (const sub of cat.subNiches) {
        if (
          sub.toLowerCase().includes(q) ||
          cat.name.toLowerCase().includes(q) ||
          cat.description.toLowerCase().includes(q)
        ) {
          matchedItems.push({ category: cat, subNiche: sub });
        }
      }
    }
    return matchedItems;
  }, [searchTerm]);

  if (!isOpen) return null;

  const activeCategory =
    BUSINESS_TAXONOMY.find((c) => c.id === selectedCategoryId) ||
    BUSINESS_TAXONOMY[0];

  const totalCategories = BUSINESS_TAXONOMY.length;
  const totalSubNiches = BUSINESS_TAXONOMY.reduce(
    (acc, cat) => acc + cat.subNiches.length,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        id="niche-selector-modal"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  B2B Niches &amp; Industry Taxonomy
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono font-semibold">
                  {totalCategories} Categories • {totalSubNiches}+ Sub-Niches
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Select any verified commercial vertical to instantly populate ingestion target criteria.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            id="btn-close-niche-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search across all 44 categories and 440+ sub-niches (e.g. 'Cybersecurity', 'HVAC', 'SaaS', 'Dentistry')..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              autoFocus
              id="search-niches-input"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
            >
              Clear
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {searchResults !== null ? (
            /* Search Results Grid */
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Found {searchResults.length} matching sub-niches for "{searchTerm}"</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <Briefcase className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm text-slate-300 font-medium">No matching niches found</p>
                  <p className="text-xs text-slate-500">
                    Try searching for terms like "tech", "medical", "industrial", "consulting", or clear your search to browse all categories.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {searchResults.map((item, idx) => {
                    const isSelected = currentNiche?.toLowerCase() === item.subNiche.toLowerCase();
                    return (
                      <button
                        key={`${item.category.id}-${item.subNiche}-${idx}`}
                        onClick={() => {
                          onSelectNiche(item.subNiche, item.category.name);
                          onClose();
                        }}
                        className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all group ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500/50 text-white'
                            : 'bg-slate-950/70 border-slate-800 hover:border-blue-500/40 hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider">
                              {item.category.name}
                            </span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-blue-400" />
                            )}
                          </div>
                          <div className="text-xs font-semibold text-white group-hover:text-blue-300">
                            {item.subNiche}
                          </div>
                        </div>
                        <div className="mt-2 text-[10px] text-slate-500 flex items-center space-x-1 group-hover:text-blue-400">
                          <span>Select target</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Two Column Category & Sub-Niche Explorer */
            <>
              {/* Left Column: 44 Categories List */}
              <div className="w-1/3 sm:w-2/5 border-r border-slate-800 overflow-y-auto bg-slate-950/40 p-2 space-y-1">
                <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Categories ({totalCategories})</span>
                </div>
                {BUSINESS_TAXONOMY.map((category) => {
                  const isActive = category.id === selectedCategoryId;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategoryId(category.id)}
                      className={`w-full px-3 py-2.5 rounded-lg text-left text-xs transition-colors flex items-center justify-between group ${
                        isActive
                          ? 'bg-blue-600 text-white font-medium shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="truncate">{category.name}</div>
                        <div
                          className={`text-[10px] truncate ${
                            isActive ? 'text-blue-100' : 'text-slate-500'
                          }`}
                        >
                          {category.subNiches.length} sub-niches
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded ${
                          isActive
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                        }`}
                      >
                        {category.code}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Sub-Niches for Selected Category */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
                      <span>{activeCategory.name}</span>
                      <span className="text-xs font-normal text-slate-400">
                        ({activeCategory.subNiches.length} Sub-Niches)
                      </span>
                    </h4>
                    <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {activeCategory.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {activeCategory.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeCategory.subNiches.map((sub, idx) => {
                    const isSelected =
                      currentNiche?.toLowerCase() === sub.toLowerCase();
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          onSelectNiche(sub, activeCategory.name);
                          onClose();
                        }}
                        className={`p-3.5 rounded-lg border text-left transition-all flex items-center justify-between group ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500/60 text-white shadow-sm'
                            : 'bg-slate-950/70 border-slate-800/90 hover:border-blue-500/50 hover:bg-slate-800/60 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/40 flex items-center justify-center font-mono text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold group-hover:text-blue-300">
                            {sub}
                          </span>
                        </div>
                        {isSelected ? (
                          <Check className="w-4 h-4 text-blue-400 shrink-0" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Click any sub-niche to target it in the ingestion pipeline</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
