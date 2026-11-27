/** Service worker + web app manifest (PWA). */

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  // Only in the production build (npm run build && npm run preview) - a service worker would
  // cache modules in dev mode and break hot reload. Set VITE_ENABLE_SW=true to force it in dev.
  if (!(import.meta.env.PROD || import.meta.env.VITE_ENABLE_SW === 'true')) return;
  const register = () => navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('Service worker registration failed:', err));
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register);
}

export function ensureManifestLink() {
  if (!document.querySelector('link[rel="manifest"]')) {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/manifest.webmanifest';
    document.head.appendChild(link);
  }
  if (!document.querySelector('meta[name="theme-color"]')) {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#0d6efd';
    document.head.appendChild(meta);
  }
}
