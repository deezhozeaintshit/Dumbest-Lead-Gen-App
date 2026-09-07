import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-amber-500/90 text-slate-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-center space-x-2 text-center shadow-md animate-in fade-in duration-200">
      <WifiOff className="w-3.5 h-3.5" />
      <span>You are currently offline. Cached pipeline data and assets remain accessible.</span>
    </div>
  );
};
