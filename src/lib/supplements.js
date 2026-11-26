// Supplement tracking (no React, no network).
// The member's stack lives in profile.supplements = ['creatine', ...];
// each day's ticks in progress.suppDays = { 'YYYY-MM-DD': { creatine: true, caffeine: 190 } },
// merged per day across devices like meals.
import { supplements } from '../data/supplements.js';
import { addDays, toISO } from './plan.js';

export const canTakeSupplements = (profile) => !(Number(profile?.age) > 0 && Number(profile.age) < 18);

export function stackOf(profile) {
  return (profile?.supplements ?? []).filter((id) => supplements[id]);
}

export function toggleInStack(profile, id) {
  const stack = stackOf(profile);
  return { ...profile, supplements: stack.includes(id) ? stack.filter((s) => s !== id) : [...stack, id] };
}

const dayOf = (progress, day) => progress.suppDays?.[day] ?? {};

function setDay(progress, day, values) {
  const days = { ...progress.suppDays };
  const clean = Object.fromEntries(Object.entries(values).filter(([, v]) => v));
  if (Object.keys(clean).length) days[day] = clean;
  else delete days[day];
  return { ...progress, suppDays: days };
}

export function takenOn(progress, day, id) {
  const info = supplements[id];
  if (info?.kind === 'shake') return (progress.meals?.[day] ?? []).some((e) => e.food === info.food);
  return Boolean(dayOf(progress, day)[id]);
}

export function toggleTaken(progress, day, id) {
  const today = dayOf(progress, day);
  return setDay(progress, day, { ...today, [id]: !today[id] });
}

export const caffeineOn = (progress, day) => Number(dayOf(progress, day).caffeine) || 0;

// mg can be negative to undo; never below 0, never silly.
export function addCaffeine(progress, day, mg) {
  const next = Math.min(2000, Math.max(0, caffeineOn(progress, day) + Number(mg || 0)));
  return setDay(progress, day, { ...dayOf(progress, day), caffeine: next });
}

// Days in a row it was taken, counting back from `day`. Not taken yet today keeps
// yesterday's streak alive (the day isn't over).
export function streak(progress, id, day = toISO(new Date())) {
  let date = new Date(`${day}T12:00:00`);
  if (!takenOn(progress, toISO(date), id)) date = addDays(date, -1);
  let n = 0;
  while (n < 3650 && takenOn(progress, toISO(date), id)) {
    n += 1;
    date = addDays(date, -1);
  }
  return n;
}
