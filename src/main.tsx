import './fetch-fix.ts';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Automatically register PWA Service Worker for offline support & Android installability
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New version detected');
  },
  onOfflineReady() {
    console.log('[PWA] App is cached and ready for offline use');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
