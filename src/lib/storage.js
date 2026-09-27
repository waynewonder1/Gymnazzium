// The browser copy of a member's plan (localStorage).
// Signed-in members also have it saved in Supabase — see context/MemberProvider.jsx.
const PROFILE_KEY = 'gymnazzium-profile';
const PROGRESS_KEY = 'gymnazzium-progress';
const PENDING_KEY = 'gymnazzium-pending';

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

// Which parts changed on this device but haven't reached the account yet (e.g. while offline).
export const loadPending = () => ({ profile: false, progress: false, ...read(PENDING_KEY) });
export const savePending = (pending) => write(PENDING_KEY, pending);

// Combines the account's progress with this device's. Every tick and logged set from
// both is kept; where both have the same entry, this device's version wins.
export function mergeProgress(remote, local) {
  const merged = { ...emptyProgress };
  for (const field of ['done', 'checks', 'missions']) merged[field] = { ...remote?.[field], ...local?.[field] };
  merged.lifts = { ...remote?.lifts };
  for (const [id, days] of Object.entries(local?.lifts ?? {})) merged.lifts[id] = { ...merged.lifts[id], ...days };
  return merged;
}

export function clearAll() {
  try {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
}
