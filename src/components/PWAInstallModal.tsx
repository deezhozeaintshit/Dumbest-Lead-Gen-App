import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  Download,
  X,
  CheckCircle2,
  Share2,
  MoreVertical,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';
import { usePWAInstall } from '../hooks/usePWAInstall.js';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'qr'>('android');

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    if (appUrl) {
      QRCode.toDataURL(appUrl, {
        width: 220,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('Failed to generate QR code', err));
    }
  }, [appUrl]);

  useEffect(() => {
    if (isIOS) {
      setActiveTab('ios');
    } else {
      setActiveTab('android');
    }
  }, [isIOS]);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-slate-200">
        {/* Header with App Branding */}
        <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900 px-6 py-5 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <img
              src="/pwa-192x192.png"
              alt="App Icon"
              className="w-12 h-12 rounded-xl shadow-lg border border-blue-500/30 object-cover"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Install Dumbest Lead Gen App
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Android PWA
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Native full-screen Android app experience with offline caching
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-3 space-x-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('android')}
            className={`pb-2.5 flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'android'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android Setup</span>
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-2.5 flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'qr'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Scan QR Code</span>
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`pb-2.5 flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'ios'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>iPhone / iPad</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {activeTab === 'android' && (
            <div className="space-y-4">
              {/* 1-Click Install Button if browser supports beforeinstallprompt */}
              {isInstallable && !isInstalled && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/80 to-indigo-950/80 border border-blue-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-left">
                    <div className="flex items-center space-x-1.5 text-blue-300 font-semibold text-xs">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Direct 1-Tap Installation Ready!</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Your Android browser is ready to install the standalone app package.
                    </p>
                  </div>
                  <button
                    onClick={handleInstallClick}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install on Android</span>
                  </button>
                </div>
              )}

              {isInstalled && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center space-x-3 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  <span>
                    App is already installed and running in standalone display mode!
                  </span>
                </div>
              )}

              {/* Step-by-Step Android Chrome Instructions */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  How to install on Android Chrome / Edge / Samsung Internet:
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <span className="font-semibold text-white">Open in Chrome or your Mobile Browser</span>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Visit this app on your Android device (or scan the QR code in the next tab).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5 font-semibold text-white">
                        <span>Tap the browser menu</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 text-[10px]">
                          <MoreVertical className="w-3 h-3" />
                        </span>
                        <span>(three dots in top right)</span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Look for <strong className="text-blue-300">"Install app"</strong> or <strong className="text-blue-300">"Add to Home screen"</strong> in the menu.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <span className="font-semibold text-white">Confirm Installation</span>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Tap <strong>Install</strong>. The app icon will be added to your Android Home Screen & App Drawer, launching full-screen without any browser address bar!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Android Features */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-center">
                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                  <div className="font-semibold text-slate-200">No App Store</div>
                  <div className="text-slate-400 text-[10px] mt-0.5">Instant 0-wait install</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                  <div className="font-semibold text-slate-200">Full Standalone</div>
                  <div className="text-slate-400 text-[10px] mt-0.5">No URL bar distraction</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                  <div className="font-semibold text-slate-200">Auto-Update</div>
                  <div className="text-slate-400 text-[10px] mt-0.5">Always latest version</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="space-y-4 text-center">
              <p className="text-xs text-slate-300">
                Point your Android camera at this QR code to open the app directly on your phone:
              </p>
              {qrCodeUrl ? (
                <div className="flex justify-center my-2">
                  <div className="p-3 bg-white rounded-2xl shadow-xl border border-slate-700">
                    <img src={qrCodeUrl} alt="Scan QR Code" className="w-48 h-48 rounded-lg" />
                  </div>
                </div>
              ) : (
                <div className="w-48 h-48 mx-auto bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 text-xs">
                  Generating QR...
                </div>
              )}

              {/* Copy URL */}
              <div className="flex items-center space-x-2 max-w-sm mx-auto">
                <input
                  type="text"
                  readOnly
                  value={appUrl}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono select-all focus:outline-hidden"
                />
                <button
                  onClick={handleCopyUrl}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Install on iPhone / iPad (Safari):
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="font-semibold text-white">Tap the Share Button</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      In Safari toolbar at the bottom of the screen, tap the <strong>Share icon</strong> (square with an arrow pointing upward).
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="font-semibold text-white">Select "Add to Home Screen"</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Scroll down the share sheet and tap <strong>Add to Home Screen</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="font-semibold text-white">Tap "Add" in Top Right</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      The app launches from your iOS Home screen with dedicated icon and standalone window.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950/70 px-6 py-3.5 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>PWA Ready &bull; Service Worker precached</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
