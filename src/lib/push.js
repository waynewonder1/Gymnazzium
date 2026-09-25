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

export async function currentSubscription() {
  if (!pushAvailable()) return null;
  const registration = await navigator.serviceWorker.getRegistration('/');
  return registration ? registration.pushManager.getSubscription() : null;
}

export async function enablePush(userId) {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error(permission === 'denied' ? 'blocked' : 'dismissed');

  await navigator.serviceWorker.register('/sw.js');
  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(VAPID_PUBLIC_KEY) }));

  const { endpoint, keys } = subscription.toJSON();
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ user_id: userId, endpoint, p256dh: keys.p256dh, auth: keys.auth }, { onConflict: 'endpoint' });
  if (error) throw error;
  return registration;
}

export async function disablePush() {
  const subscription = await currentSubscription();
  if (!subscription) return;
  await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
  await subscription.unsubscribe();
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
