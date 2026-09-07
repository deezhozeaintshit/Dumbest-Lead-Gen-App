import React from 'react';
import {
  LayoutDashboard,
  Search,
  Zap,
  Layers,
  Settings,
  ShieldCheck,
  X,
  LogOut,
  User as UserIcon,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface SidebarProps {
  activeTab: 'dashboard' | 'explorer' | 'jobs' | 'adapters' | 'settings' | 'niches';
  onSelectTab: (tab: 'dashboard' | 'explorer' | 'jobs' | 'adapters' | 'settings' | 'niches') => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  activeJobsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  activeJobsCount,
}) => {
  const { user, logout } = useAuth();

  const handleNavClick = (tab: 'dashboard' | 'explorer' | 'jobs' | 'adapters' | 'settings' | 'niches') => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'US';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 border-r border-slate-800 flex flex-col justify-between bg-[#0C0C0E] text-slate-200 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-base shadow-sm shrink-0">
                L
              </div>
              <div className="overflow-hidden">
                <span className="text-base font-semibold tracking-tight text-white block truncate">LeadPipeline</span>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider truncate">
                  Ingestion Engine
                </p>
              </div>
            </div>
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-slate-400 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Section */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <div className="px-2 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Navigation
            </div>

            <button
              onClick={() => handleNavClick('dashboard')}
              className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800/60 text-blue-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/20'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => handleNavClick('explorer')}
              className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded transition-colors ${
                activeTab === 'explorer'
                  ? 'bg-slate-800/60 text-blue-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/20'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4" />
                <span>Lead Explorer</span>
              </div>
            </button>

            <button
              onClick={() => handleNavClick('jobs')}
              className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded transition-colors ${
                activeTab === 'jobs'
                  ? 'bg-slate-800/60 text-blue-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/20'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4" />
                <span>Active Jobs</span>
              </div>
              {activeJobsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-semibold border border-blue-500/30 animate-pulse">
                  {activeJobsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('niches')}
              className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded transition-colors ${
                activeTab === 'niches'
                  ? 'bg-slate-800/60 text-blue-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/20'
              }`}
              id="sidebar-nav-niches"
            >
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4" />
                <span>Niches Directory</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono font-semibold border border-blue-500/20">
                440+
              </span>
            </button>

            <div className="pt-4 px-2 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Management
            </div>

            <button
              onClick={() => handleNavClick('adapters')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded transition-colors ${
                activeTab === 'adapters'
                  ? 'bg-slate-800/60 text-blue-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/20'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>API Adapters</span>
            </button>

            <button
              onClick={() => handleNavClick('settings')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded transition-colors ${
                activeTab === 'settings'
                  ? 'bg-slate-800/60 text-blue-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/20'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings &amp; Rules</span>
            </button>
          </nav>
        </div>

        {/* Bottom Section: Security Status & Authenticated User Card */}
        <div>
          <div className="px-3 py-2 mx-3 mb-2 rounded bg-slate-900/60 border border-slate-800 flex items-center space-x-2 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">JWT Auth &bull; SQLite Vault</span>
          </div>

          {/* User Card with Logout */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center text-xs font-semibold shrink-0">
                  {userInitials}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-medium text-slate-200 truncate">
                    {user?.name || user?.email || 'Authenticated'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono truncate uppercase">
                    {user?.role || 'MEMBER'}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800/60 rounded transition-colors"
                title="Logout"
                id="sidebar-logout-btn"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
