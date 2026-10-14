// "Install app" support. Chrome/Android fire `beforeinstallprompt` early — often before
// React has rendered — so we catch it here at startup and let components ask for it later.
let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);

// iPads on iPadOS 13+ say they're a Mac, so also check for a touch screen.
export const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1));

// Links tapped inside Instagram, Facebook, TikTok and similar open in that app's own browser,
// which can't install apps. (WhatsApp usually hands links to the real browser, but not always.)
export const isInAppBrowser = () =>
  typeof navigator !== 'undefined' && /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|Snapchat|Line\/|WhatsApp|; wv\)/.test(navigator.userAgent);

export function initInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // we show our own button instead of the browser's mini-bar
    deferredPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

export const canPromptInstall = () => deferredPrompt !== null;

export function onInstallChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Shows the browser's install dialog. Returns true if the person installed it.
export async function promptInstall() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  notify();
  return outcome === 'accepted';
}

// Keeps a copy of the app on the device for offline use (production builds only;
// in development it would fight Vite's live reload).
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
