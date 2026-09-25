// Browser notifications for workout reminders.
// These only fire while the site is open in a tab. For reminders when it's closed,
// members add the plan to their calendar (lib/calendar.js).
import { loadProfile, loadProgress } from './storage';
import { getDay, toISO, todayIndex, totalDays } from './plan';

const SETTING_KEY = 'gymnazzium-reminders';
const LAST_KEY = 'gymnazzium-last-reminder';

export const remindersSupported = () => typeof window !== 'undefined' && 'Notification' in window;

export function remindersEnabled() {
  try {
    return remindersSupported() && Notification.permission === 'granted' && localStorage.getItem(SETTING_KEY) === 'on';
  } catch {
    return false;
  }
}

export function setRemindersEnabled(on) {
  try {
    localStorage.setItem(SETTING_KEY, on ? 'on' : 'off');
  } catch {
    // ignore
  }
}

// Called every minute. Sends at most one reminder per day, at or after the member's workout time.
export function checkReminder() {
  if (!remindersEnabled()) return;
  const profile = loadProfile();
  if (!profile) return;
  const index = todayIndex(profile);
  if (index < 0 || index >= totalDays(profile)) return;

  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  if (hhmm < (profile.workoutTime || '06:30')) return;

  try {
    if (localStorage.getItem(LAST_KEY) === toISO(now)) return;
    localStorage.setItem(LAST_KEY, toISO(now));
  } catch {
    return;
  }

  const day = getDay(profile, index);
  if (day.type === 'train') {
    if (loadProgress().done[index]) return;
    new Notification(`Time for ${day.title}`, { body: `${day.focus}. ${day.items.length} exercises, about ${day.minutes} min.` });
  } else {
    new Notification(`${day.title}: today's mission`, { body: day.mission });
  }
}
