// The auto rest timer: logging a set starts a countdown shown in a bar at the bottom
// of the screen (components/RestBar.jsx). A tiny store so any component can start it.
const SETTINGS_KEY = 'gymnazzium-rest';
const listeners = new Set();
let state = { endsAt: 0, total: 0, label: '' }; // endsAt 0 = not running

const notify = () => listeners.forEach((fn) => fn());

export const getRest = () => state;

export function subscribeRest(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getRestSettings() {
  try {
    return { on: true, seconds: 90, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
  } catch {
    return { on: true, seconds: 90 };
  }
}

export function setRestSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
  notify();
}

// Starts (or restarts) the countdown, if auto rest is switched on.
export function startRest(label) {
  const { on, seconds } = getRestSettings();
  if (!on) return;
  state = { endsAt: Date.now() + seconds * 1000, total: seconds, label };
  notify();
}

export function addRest(seconds) {
  if (!state.endsAt) return;
  state = { ...state, endsAt: state.endsAt + seconds * 1000, total: state.total + seconds };
  notify();
}

export function stopRest() {
  state = { endsAt: 0, total: 0, label: '' };
  notify();
}
