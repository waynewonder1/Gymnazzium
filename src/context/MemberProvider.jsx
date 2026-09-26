import { useEffect, useState } from 'react';
import { MemberContext } from './member';
import { backendEnabled, supabase } from '../lib/supabase';
import { clearAll, emptyProgress, loadProfile, loadProgress, saveProfile as saveLocalProfile, saveProgress as saveLocalProgress } from '../lib/storage';
import { disablePush } from '../lib/push';

// The browser copy (localStorage) is always kept up to date so the site works offline
// and for guests. When someone is signed in, every change is also saved to Supabase.
function MemberProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!backendEnabled);
  const [profile, setProfile] = useState(loadProfile);
  const [progress, setProgress] = useState(loadProgress);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [adminFor, setAdminFor] = useState(null); // user id we confirmed is an admin
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
    if (!userId) return;
    let cancelled = false;
    supabase.rpc('is_admin').then(({ data }) => {
      if (!cancelled && data === true) setAdminFor(userId);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // On sign-in: load the account's plan, or upload the one made before signing in.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function sync() {
      setSyncing(true);
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

  const remoteSave = async (table, data) => {
    if (!userId) return;
    const { error } = await supabase.from(table).upsert({ user_id: userId, data, updated_at: new Date().toISOString() });
    setSyncError(error ? error.message : null);
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
    saveProfile,
    saveProgress,
    clearPlan,
    signOut,
  };
  return <MemberContext.Provider value={value}>{children}</MemberContext.Provider>;
}

export default MemberProvider;
