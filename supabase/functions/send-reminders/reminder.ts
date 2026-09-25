// Decides what (if anything) to push to one member right now.
// Kept free of network/database code so it can be tested on its own.
import { getDay, totalDays } from '../_shared/lib/plan.js';

type Profile = {
  startDate: string;
  timeline: string;
  workoutTime?: string;
  timezone?: string;
  [key: string]: unknown;
};
type Progress = { done?: Record<string, boolean> };
type Day = { type: 'train' | 'rest'; title: string; focus: string; mission: string; minutes?: number; items?: unknown[] };

export type Reminder = {
  localDate: string;
  payload: { title: string; body: string; url: string; tag: string };
};

const FALLBACK_ZONE = 'Africa/Nairobi';

export function localNow(timeZone: string | undefined, now: Date) {
  let zone = timeZone || FALLBACK_ZONE;
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: zone });
  } catch {
    zone = FALLBACK_ZONE;
  }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

export function buildReminder(profile: Profile, progress: Progress | null, now: Date): Reminder | null {
  const local = localNow(profile.timezone, now);
  if (local.time < (profile.workoutTime || '06:30')) return null;

  const index = daysBetween(profile.startDate, local.date);
  if (index < 0 || index >= totalDays(profile)) return null;

  const day = getDay(profile, index) as Day;
  const tag = `gymnazzium-${local.date}`;

  if (day.type === 'train') {
    if (progress?.done?.[index]) return null; // already trained today
    return {
      localDate: local.date,
      payload: {
        title: `Time for ${day.title}`,
        body: `${day.focus}. ${day.items?.length ?? 0} exercises, about ${day.minutes} min.`,
        url: '/plan',
        tag,
      },
    };
  }
  return {
    localDate: local.date,
    payload: { title: `${day.title}: today's mission`, body: day.mission, url: '/plan', tag },
  };
}
