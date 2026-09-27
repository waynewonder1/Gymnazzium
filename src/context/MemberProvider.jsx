import { useEffect, useState } from 'react';
import { MemberContext } from './member';
import { backendEnabled, supabase } from '../lib/supabase';
import {
  clearAll,
  emptyProgress,
  loadPending,
  loadProfile,
  loadProgress,
  mergeProgress,
  savePending,
  saveProfile as saveLocalProfile,
  saveProgress as saveLocalProgress,
} from '../lib/storage';
import { disablePush } from '../lib/push';

const now = () => new Date().toISOString();
const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

// Sends changes made on this device that haven't reached the account yet (e.g. logged
// at a gym with no signal). Progress is merged with the account's copy, so nothing
// logged on another device is lost either.
async function pushPending(userId) {
  const pending = loadPending();
  const result = {};
  if (pending.progress) {
    const remote = await supabase.from('progress').select('data').eq('user_id', userId).maybeSingle();
    if (remote.error) return { error: remote.error };
    const merged = mergeProgress(remote.data?.data, loadProgress());
    const { error } = await supabase.from('progress').upsert({ user_id: userId, data: merged, updated_at: now() });
    if (error) return { error };
    result.progress = merged;
  }
  const localProfile = loadProfile();
  if (pending.profile && localProfile) {
    const { error } = await supabase.from('profiles').upsert({ user_id: userId, data: localProfile, updated_at: now() });
    if (error) return { error };
  }
  savePending({ profile: false, progress: false });
  return result;
}

// The browser copy (localStorage) is always kept up to date so the site works offline
// and for guests. When someone is signed in, every change is also saved to Supabase;
// changes made offline are marked pending and sent when the connection comes back.
function MemberProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!backendEnabled);
  const [profile, setProfile] = useState(loadProfile);
  const [progress, setProgress] = useState(loadProgress);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [adminFor, setAdminFor] = useState(null); // user id we confirmed is an admin
  const [online, setOnline] = useState(() => !isOffline());
  const [pendingSync, setPendingSync] = useState(() => {
    const p = loadPending();
    return p.profile || p.progress;
  });
  const user = session?.user ?? null;
  const userId = user?.id;

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  // Staff check for the /admin page. The database enforces it; this only shows or hides the link.
  useEffect(() => {
    if (!userId || !online) return;
    let cancelled = false;
    supabase.rpc('is_admin').then(({ data }) => {
      if (!cancelled && data === true) setAdminFor(userId);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, online]);

  // On sign-in: load the account's plan, or upload the one made before signing in.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function sync() {
      // No signal: keep using this device's copy; it syncs when the connection returns.
      if (isOffline()) return;
      setSyncing(true);

      // Changes made offline go up first (merged), instead of being overwritten by the account's older copy.
      const pending = loadPending();
      if (pending.profile || pending.progress) {
        const pushed = await pushPending(userId);
        if (cancelled) return;
        if (pushed.error) setSyncError(pushed.error.message);
        else {
          if (pushed.progress) {
            saveLocalProgress(pushed.progress);
            setProgress(pushed.progress);
          }
          setSyncError(null);
          setPendingSync(false);
        }
        setSyncing(false);
        return;
      }

      const [remoteProfile, remoteProgress] = await Promise.all([
        supabase.from('profiles').select('data').eq('user_id', userId).maybeSingle(),
        supabase.from('progress').select('data').eq('user_id', userId).maybeSingle(),
      ]);
      if (cancelled) return;
      const error = remoteProfile.error || remoteProgress.error;

      if (error) {
        setSyncError(error.message);
      } else if (remoteProfile.data) {
        const nextProgress = { ...emptyProgress, ...remoteProgress.data?.data };
        saveLocalProfile(remoteProfile.data.data);
        saveLocalProgress(nextProgress);
        setProfile(remoteProfile.data.data);
        setProgress(nextProgress);
      } else {
        const localProfile = loadProfile();
        if (localProfile) {
          const results = await Promise.all([
            supabase.from('profiles').upsert({ user_id: userId, data: localProfile, updated_at: new Date().toISOString() }),
            supabase.from('progress').upsert({ user_id: userId, data: loadProgress(), updated_at: new Date().toISOString() }),
          ]);
          const uploadError = results.find((r) => r.error)?.error;
          if (!cancelled && uploadError) setSyncError(uploadError.message);
        }
      }
      if (!cancelled) setSyncing(false);
    }

    sync();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Track online/offline, and send anything pending as soon as the connection is back.
  useEffect(() => {
    const goOffline = () => setOnline(false);
    const goOnline = async () => {
      setOnline(true);
      if (!userId) return;
      const pending = loadPending();
      if (!pending.profile && !pending.progress) return;
      const pushed = await pushPending(userId);
      if (pushed.error) return setSyncError(pushed.error.message);
      if (pushed.progress) {
        saveLocalProgress(pushed.progress);
        setProgress(pushed.progress);
      }
      setSyncError(null);
      setPendingSync(false);
    };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, [userId]);

  const remoteSave = async (table, data) => {
    if (!userId) return;
    const key = table === 'profiles' ? 'profile' : 'progress';
    // Mark it pending first; cleared only once the account has it.
    savePending({ ...loadPending(), [key]: true });
    setPendingSync(true);
    if (isOffline()) return;
    const { error } = await supabase.from(table).upsert({ user_id: userId, data, updated_at: now() });
    if (error) {
      // A dropped connection isn't worth an error banner; it'll sync when back online.
      if (!isOffline()) setSyncError(error.message);
      return;
    }
    const pending = { ...loadPending(), [key]: false };
    savePending(pending);
    setPendingSync(pending.profile || pending.progress);
    setSyncError(null);
  };

  const saveProfile = (next) => {
    const withZone = { ...next, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    saveLocalProfile(withZone);
    setProfile(withZone);
    return remoteSave('profiles', withZone);
  };

  const saveProgress = (next) => {
    saveLocalProgress(next);
    setProgress(next);
    return remoteSave('progress', next);
  };

  const clearPlan = async () => {
    clearAll();
    setProfile(null);
    setProgress(emptyProgress);
    if (userId) {
      await Promise.all([
        supabase.from('profiles').delete().eq('user_id', userId),
        supabase.from('progress').delete().eq('user_id', userId),
      ]);
    }
  };

  // Signing out removes this person's plan from the browser, so the next person
  // on a shared phone doesn't see it. It's still safe in their account.
  const signOut = async () => {
    await disablePush().catch(() => {});
    await supabase.auth.signOut();
    clearAll();
    setProfile(null);
    setProgress(emptyProgress);
  };

  const value = {
    backendEnabled,
    authReady,
    user,
    isAdmin: Boolean(userId) && adminFor === userId,
    profile,
    progress,
    syncing,
    syncError,
    online,
    pendingSync,
    saveProfile,
    saveProgress,
    clearPlan,
    signOut,
  };
  return <MemberContext.Provider value={value}>{children}</MemberContext.Provider>;
}

export default MemberProvider;
