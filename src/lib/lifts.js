// Weight logging. Logged sets live in progress.lifts:
//   { [exerciseId]: { [dayIndex]: [{ w: kg | null (bodyweight), r: reps | null }] } }
import { exercises } from '../data/workouts.js';
import { parseDose } from './plan.js';

// Timed moves (holds, jogs, rounds) and warm-ups aren't logged.
export const isLoggable = (id) => {
  const ex = exercises[id];
  return !ex || ex.kind === 'weight' || ex.kind === 'reps';
};

export const setCount = (dose) => Math.min(10, Math.max(1, parseDose(dose).sets));

// "8–12" → 12, "10" → 10.
export function topOfRange(dose) {
  const nums = parseDose(dose).reps.match(/\d+/g);
  return nums ? Number(nums.at(-1)) : null;
}

const hasReps = (sets) => sets?.some((s) => s.r > 0);

// The most recent logged session for this exercise before a given day.
export function lastLog(lifts, id, beforeIndex) {
  const entries = lifts?.[id];
  if (!entries) return null;
  const index = Object.keys(entries)
    .map(Number)
    .filter((i) => i < beforeIndex && hasReps(entries[i]))
    .sort((a, b) => b - a)[0];
  return index === undefined ? null : { index, sets: entries[index] };
}

const fmtWeight = (w) => (w ? `${w} kg` : 'BW');

// [{w:60,r:10},{w:60,r:9}] → "60 kg × 10, 9"; mixed weights → "60 kg × 10, 65 kg × 8".
export function formatSets(sets) {
  const done = sets.filter((s) => s.r > 0);
  if (done.length === 0) return '';
  if (done.every((s) => s.w === done[0].w)) return `${fmtWeight(done[0].w)} × ${done.map((s) => s.r).join(', ')}`;
  return done.map((s) => `${fmtWeight(s.w)} × ${s.r}`).join(', ');
}

// Your rule: hit the top of the rep range on every set → add weight next time.
export function suggestion(last, dose) {
  const top = topOfRange(dose);
  if (!last || !top) return null;
  const done = last.sets.filter((s) => s.r > 0);
  if (done.length === 0 || !done.every((s) => s.r >= top)) return null;
  return done[0].w ? `You hit ${top} on every set last time. Add weight today 💪` : `You hit ${top} on every set last time. Try a harder variation or add weight.`;
}

// Estimated one-rep max (Epley), used to compare sessions with different weights and reps.
export const estimatedMax = (w, r) => (w && r ? Math.round(w * (1 + r / 30) * 10) / 10 : 0);

// Every logged session for one exercise, oldest first, with its best set.
export function history(lifts, id) {
  return Object.entries(lifts?.[id] ?? {})
    .map(([index, sets]) => {
      const done = sets.filter((s) => s.r > 0);
      if (done.length === 0) return null;
      // Best set: highest estimated max, or most reps for bodyweight moves.
      const weighted = done.some((s) => s.w);
      const best = done.reduce((a, b) => (weighted ? (estimatedMax(b.w, b.r) > estimatedMax(a.w, a.r) ? b : a) : b.r > a.r ? b : a));
      return { index: Number(index), sets: done, best, e1rm: estimatedMax(best.w, best.r), volume: done.reduce((v, s) => v + (s.w || 0) * s.r, 0) };
    })
    .filter(Boolean)
    .sort((a, b) => a.index - b.index);
}
