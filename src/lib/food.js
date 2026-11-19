// Food tracker logic (no React, no network): logging meals per day, totals, recent foods,
// and post-workout meal ideas. Stored in progress.meals = { 'YYYY-MM-DD': [entry, ...] } and
// progress.customFoods = { [id]: { name, portion, kcal, p } }, so it syncs like workouts do.
import { foods } from '../data/foods.js';
import { meals } from '../data/meals.js';
import { toISO } from './plan.js';

export const dayKey = (date = new Date()) => toISO(date);

export function foodInfo(id, progress) {
  return foods[id] ?? progress?.customFoods?.[id] ?? null;
}

let counter = 0;
const newId = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`;

// An entry keeps its own calories and protein, so changing the food list never rewrites history.
export function makeEntry(id, info, qty = 1, at = Date.now()) {
  return { id: newId(), food: id, name: info.name, qty, kcal: Math.round(info.kcal * qty), p: Math.round(info.p * qty * 10) / 10, at };
}

export function addFoods(progress, day, items, at = Date.now()) {
  const added = items
    .map(([id, qty]) => {
      const info = foodInfo(id, progress);
      return info ? makeEntry(id, info, qty, at) : null;
    })
    .filter(Boolean);
  const mealsByDay = { ...progress.meals, [day]: [...(progress.meals?.[day] ?? []), ...added] };
  return { ...progress, meals: mealsByDay };
}

export function removeEntry(progress, day, entryId) {
  const left = (progress.meals?.[day] ?? []).filter((e) => e.id !== entryId);
  const mealsByDay = { ...progress.meals };
  if (left.length) mealsByDay[day] = left;
  else delete mealsByDay[day];
  return { ...progress, meals: mealsByDay };
}

export function addCustomFood(progress, { name, portion, kcal, p }) {
  const id = `custom-${newId()}`;
  const food = { name: name.trim().slice(0, 60), portion: (portion || '1 portion').trim().slice(0, 40), kcal: Math.max(0, Math.round(Number(kcal) || 0)), p: Math.max(0, Math.round((Number(p) || 0) * 10) / 10), cat: 'My foods' };
  return { id, progress: { ...progress, customFoods: { ...progress.customFoods, [id]: food } } };
}

export function totals(entries = []) {
  return entries.reduce((t, e) => ({ kcal: t.kcal + e.kcal, p: Math.round((t.p + e.p) * 10) / 10 }), { kcal: 0, p: 0 });
}

// Most recently logged foods first, each once.
export function recentFoods(progress, limit = 8) {
  const all = Object.values(progress.meals ?? {}).flat().sort((a, b) => b.at - a.at);
  const seen = [];
  for (const e of all) {
    if (!seen.includes(e.food) && foodInfo(e.food, progress)) seen.push(e.food);
    if (seen.length >= limit) break;
  }
  return seen;
}

// The Refuel pop-up shows once a day on each device.
const REFUEL_KEY = 'gymnazzium-refuel-shown';
export function refuelShownToday() {
  try {
    return localStorage.getItem(REFUEL_KEY) === dayKey();
  } catch {
    return false;
  }
}
export function markRefuelShown() {
  try {
    localStorage.setItem(REFUEL_KEY, dayKey());
  } catch {
    // Storage blocked: it may show again, that's all.
  }
}

export function timeOfDay(date = new Date()) {
  const h = date.getHours();
  return h < 11 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

export function mealTotals(meal) {
  return meal.items.reduce((t, [id, qty]) => ({ kcal: t.kcal + Math.round(foods[id].kcal * qty), p: Math.round((t.p + foods[id].p * qty) * 10) / 10 }), { kcal: 0, p: 0 });
}

// Three ideas that fit the goal and the time of day; they change from day to day.
export function refuelIdeas(goal = 'maintain', date = new Date(), count = 3) {
  const when = timeOfDay(date);
  let list = meals.filter((m) => m.goal === goal && m.when.includes(when));
  if (list.length < count) list = [...list, ...meals.filter((m) => m.goal === goal && !list.includes(m))];
  const start = Math.floor(date.getTime() / 86400000) % list.length;
  return Array.from({ length: Math.min(count, list.length) }, (_, i) => list[(start + i) % list.length]);
}
