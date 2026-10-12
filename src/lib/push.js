// Real push notifications: the browser gives us a subscription, we store it in Supabase,
// and the send-reminders Edge Function pushes to it at the member's workout time —
// even when the site is closed.
import { backendEnabled, supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim();

export const pushAvailable = () =>
  backendEnabled &&
  Boolean(VAPID_PUBLIC_KEY) &&
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

// iPhones only allow web push for sites added to the Home Screen.
export const needsHomeScreen = () =>
  typeof navigator !== 'undefined' &&
  /iPhone|iPad|iPod/.test(navigator.userAgent) &&
  !window.matchMedia('(display-mode: standalone)').matches;

function keyToBytes(base64url) {
  const padded = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

// A subscription made with an older VAPID key can't receive our pushes (the push service rejects them),
// so after a key change it has to be replaced.
function usesCurrentKey(subscription) {
  const key = subscription.options?.applicationServerKey;
  if (!key) return true; // this browser doesn't say; assume it's current
  const used = new Uint8Array(key);
  const current = keyToBytes(VAPID_PUBLIC_KEY);
  return used.length === current.length && used.every((b, i) => b === current[i]);
}

async function dropSubscription(subscription) {
  await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
  await subscription.unsubscribe();
}

export async function currentSubscription() {
  if (!pushAvailable()) return null;
  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = registration ? await registration.pushManager.getSubscription() : null;
  return subscription && usesCurrentKey(subscription) ? subscription : null;
}

export async function enablePush(userId) {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error(permission === 'denied' ? 'blocked' : 'dismissed');

  await navigator.serviceWorker.register('/sw.js');
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (subscription && !usesCurrentKey(subscription)) {
    await dropSubscription(subscription);
    subscription = null;
  }
  subscription ??= await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyToBytes(VAPID_PUBLIC_KEY),
  });

  const { endpoint, keys } = subscription.toJSON();
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ user_id: userId, endpoint, p256dh: keys.p256dh, auth: keys.auth }, { onConflict: 'endpoint' });
  if (error) throw error;
  return registration;
}

// Members who already allowed notifications get a fresh subscription without being asked again
// when their old one was made with a previous key.
export async function renewStalePush(userId) {
  if (!pushAvailable() || Notification.permission !== 'granted') return;
  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = registration && (await registration.pushManager.getSubscription());
  if (subscription && !usesCurrentKey(subscription)) await enablePush(userId);
}

export async function disablePush() {
  if (!pushAvailable()) return;
  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = registration && (await registration.pushManager.getSubscription());
  if (subscription) await dropSubscription(subscription);
}

// Shows a notification through the service worker, to prove this device can display them.
export async function testNotification() {
  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification('Gymnazzium reminders are on', {
    body: "You'll get a push at your workout time, even when this site is closed.",
    icon: '/icon-192.png',
    data: { url: '/plan' },
  });
}
