// The browser copy of a member's plan (localStorage).
// Signed-in members also have it saved in Supabase — see context/MemberProvider.jsx.
const PROFILE_KEY = 'gymnazzium-profile';
const PROGRESS_KEY = 'gymnazzium-progress';

export const emptyProgress = { done: {}, checks: {}, missions: {}, lifts: {} };

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (e.g. private mode) — the app still works for this visit.
  }
}

export const loadProfile = () => {
  const profile = read(PROFILE_KEY);
  // Profiles from before the plan feature have no start date.
  return profile?.startDate ? profile : null;
};
export const saveProfile = (profile) => write(PROFILE_KEY, profile);

export const loadProgress = () => ({ ...emptyProgress, ...read(PROGRESS_KEY) });
export const saveProgress = (progress) => write(PROGRESS_KEY, progress);

export function clearAll() {
  try {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // ignore
  }
}
