import React, { useState } from 'react';
import { Smartphone, Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.js';
import { PWAInstallModal } from './PWAInstallModal.js';

export const PWAMobileBanner: React.FC = () => {
  const { isInstalled, isMobile, isAndroid, isInstallable, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed) return null;

  const handleAction = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) {
        setModalOpen(true);
      }
    } else {
      setModalOpen(true);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-blue-500/30 px-4 py-2 text-xs flex items-center justify-between gap-3 text-slate-200">
        <div className="flex items-center space-x-2.5 min-w-0">
          <img
            src="/pwa-192x192.png"
            alt="App Icon"
            className="w-7 h-7 rounded-lg shrink-0 border border-blue-400/30 object-cover"
          />
          <div className="truncate">
            <span className="font-semibold text-white">
              {isAndroid ? 'Install on Android' : 'Install Dumbest Lead Gen App'}
            </span>
            <span className="hidden sm:inline text-slate-400 ml-1.5">
              &bull; Fast offline access & full-screen standalone mode
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleAction}
            className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Install</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <PWAInstallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
