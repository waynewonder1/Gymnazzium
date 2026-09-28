// "This week at a glance": the Monday–Sunday week containing today.
import { getDay, streak, totalDays } from './plan.js';
import { prFor } from './lifts.js';

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function weekSummary(profile, progress, today) {
  const total = totalDays(profile);
  const todayDate = getDay(profile, today).date;
  const first = today - ((todayDate.getDay() + 6) % 7); // index of this week's Monday

  let planned = 0;
  let done = 0;
  const days = LETTERS.map((letter, k) => {
    const i = first + k;
    if (i < 0 || i >= total) return { letter, state: 'none' };
    const day = getDay(profile, i);
    if (day.type === 'rest') return { letter, state: i === today ? 'rest today' : 'rest', title: day.title };
    planned++;
    const isDone = Boolean(progress.done[i]);
    if (isDone) done++;
    const state = isDone ? 'done' : i < today ? 'missed' : i === today ? 'today' : 'todo';
    return { letter, state, title: day.title };
  });

  // Lifting stats for logged sets on this week's days.
  let sets = 0;
  let volume = 0;
  let prs = 0;
  for (const [id, byDay] of Object.entries(progress.lifts ?? {})) {
    for (const [index, logged] of Object.entries(byDay)) {
      const i = Number(index);
      if (i < first || i > first + 6) continue;
      for (const s of logged) {
        if (s.r > 0) {
          sets++;
          volume += (s.w || 0) * s.r;
        }
      }
      if (prFor(progress.lifts, id, i)) prs++;
    }
  }

  return { days, planned, done, sets, volume: Math.round(volume), prs, streak: streak(profile, progress.done) };
}
