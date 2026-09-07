import React, { useState } from 'react';
import { Smartphone, Download, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.js';
import { PWAInstallModal } from './PWAInstallModal.js';

interface PWAInstallButtonProps {
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();
  const [modalOpen, setModalOpen] = useState(false);

  // If already installed and running standalone, show a clean active badge
  if (isInstalled) {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 flex items-center space-x-1.5 transition-colors ${className}`}
          title="App is installed on Android/Desktop"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Installed</span>
        </button>
        <PWAInstallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setModalOpen(true);
      }
    } else {
      setModalOpen(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 flex items-center space-x-1.5 transition-all transform active:scale-95 cursor-pointer ${className}`}
        title="Install Dumbest Lead Gen App on Android or Mobile"
      >
        <Smartphone className="w-3.5 h-3.5 text-blue-200" />
        <span className="hidden sm:inline">
          {isAndroid ? 'Install on Android' : 'Install App'}
        </span>
        <span className="sm:hidden">Install</span>
        <Download className="w-3 h-3 text-blue-200 opacity-80" />
      </button>

      <PWAInstallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
