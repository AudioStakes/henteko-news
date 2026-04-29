import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

async function cleanupLegacyServiceWorkers() {
  if (!('serviceWorker' in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}

cleanupLegacyServiceWorkers().catch(() => {
  // ignore cleanup issues
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
