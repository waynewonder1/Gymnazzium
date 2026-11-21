import { AuthClient } from '@supabase/auth-js';
import { PostgrestClient } from '@supabase/postgrest-js';

// Set these in a .env file (see .env.example). Without them the site still works,
// saving everything in the browser only.
// .trim(): tolerate stray spaces/line breaks pasted into hosting settings.
const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// A light client: only login (auth) and the database (rest). The app doesn't use realtime,
// storage or Edge Function calls from the browser, and leaving them out (the full
// @supabase/supabase-js bundles all of them) makes the first download much smaller on phones.
// Same settings and the same saved-login key as supabase-js, so nobody gets logged out.
function createLightClient(baseUrl, key) {
  const base = new URL(baseUrl);
  const auth = new AuthClient({
    url: new URL('auth/v1', base).href,
    headers: { Authorization: `Bearer ${key}`, apikey: key },
    storageKey: `sb-${base.hostname.split('.')[0]}-auth-token`,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
  });
  // Database calls carry the member's login token when there is one (row-level security).
  const authedFetch = async (input, init) => {
    const { data } = await auth.getSession();
    const headers = new Headers(init?.headers);
    if (!headers.has('apikey')) headers.set('apikey', key);
    if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${data.session?.access_token ?? key}`);
    return fetch(input, { ...init, headers });
  };
  const rest = new PostgrestClient(new URL('rest/v1', base).href, { headers: {}, fetch: authedFetch });
  return {
    auth,
    from: (table) => rest.from(table),
    rpc: (fn, args, options) => rest.rpc(fn, args, options),
  };
}

export const supabase = url && anonKey ? createLightClient(url, anonKey) : null;
export const backendEnabled = supabase !== null;
