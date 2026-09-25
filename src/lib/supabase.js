import { createClient } from '@supabase/supabase-js';

// Set these in a .env file (see .env.example). Without them the site still works,
// saving everything in the browser only.
// .trim(): tolerate stray spaces/line breaks pasted into hosting settings.
const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const supabase = url && anonKey ? createClient(url, anonKey) : null;
export const backendEnabled = supabase !== null;
