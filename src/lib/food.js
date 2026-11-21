// Food tracker logic (no React, no network): logging meals per day, totals, recent foods,
// and post-workout meal ideas. Stored in progress.meals = { 'YYYY-MM-DD': [entry, ...] } and
// progress.customFoods = { [id]: { name, portion, kcal, p, c?, f? } }, so it syncs like workouts do.
// Foods from data/foods.js are per 100 g with portion sizes; own foods are per portion.
import { amountOf, foods } from '../data/foods.js';
import { meals } from '../data/meals.js';
import { toISO } from './plan.js';

export const dayKey = (date = new Date()) => toISO(date);

export function foodInfo(id, progress) {
  return foods[id] ?? progress?.customFoods?.[id] ?? null;
}

let counter = 0;
const newId = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`;

const qtyText = (q) => (q === 0.5 ? '½' : q === 1.5 ? '1½' : String(q));
const round1 = (n) => Math.round(n * 10) / 10;

// An entry keeps its own calories and macros, so changing the food list never rewrites history.
// qty = how many of the chosen portion (portion = index into the food's portions);
// grams instead of a portion when the member typed an exact amount.
export function makeEntry(id, info, qty = 1, at = Date.now(), { portion = 0, grams = null } = {}) {
  const base = { id: newId(), food: id, name: info.name, at };
  if (info.per100) {
    const size = info.portions[portion] ?? info.portions[0];
    const g = grams ?? size.g * qty;
    const label = grams ? `${Math.round(grams)} ${info.unit}` : qty === 1 ? size.label : `${qtyText(qty)} × ${size.label}`;
    return { ...base, qty: grams ? null : qty, g: Math.round(g), label, ...amountOf(info, g) };
  }
  // Own foods: values are for one portion.
  return { ...base, qty, kcal: Math.round(info.kcal * qty), p: round1(info.p * qty), c: round1((info.c ?? 0) * qty), f: round1((info.f ?? 0) * qty) };
}

// items: [foodId, qty, portionIndex?] (portion 0 = the usual one).
export function addFoods(progress, day, items, at = Date.now()) {
  const added = items
    .map(([id, qty, portion = 0]) => {
      const info = foodInfo(id, progress);
      return info ? makeEntry(id, info, qty, at, { portion }) : null;
    })
    .filter(Boolean);
  const mealsByDay = { ...progress.meals, [day]: [...(progress.meals?.[day] ?? []), ...added] };
  return { ...progress, meals: mealsByDay };
}

// An exact amount in grams (or ml) of a food from the list.
export function addGrams(progress, day, id, grams, at = Date.now()) {
  const info = foods[id];
  const g = Number(grams);
  if (!info || !(g > 0) || g > 5000) return progress;
  const entry = makeEntry(id, info, null, at, { grams: g });
  return { ...progress, meals: { ...progress.meals, [day]: [...(progress.meals?.[day] ?? []), entry] } };
}

export function removeEntry(progress, day, entryId) {
  const left = (progress.meals?.[day] ?? []).filter((e) => e.id !== entryId);
  const mealsByDay = { ...progress.meals };
  if (left.length) mealsByDay[day] = left;
  else delete mealsByDay[day];
  return { ...progress, meals: mealsByDay };
}

const grams = (v) => Math.max(0, round1(Number(v) || 0));

export function addCustomFood(progress, { name, portion, kcal, p, c, f }) {
  const id = `custom-${newId()}`;
  const food = { name: name.trim().slice(0, 60), portion: (portion || '1 portion').trim().slice(0, 40), kcal: Math.max(0, Math.round(Number(kcal) || 0)), p: grams(p), c: grams(c), f: grams(f), cat: 'My foods' };
  return { id, progress: { ...progress, customFoods: { ...progress.customFoods, [id]: food } } };
}

// Entries logged before carbs and fat were tracked count as 0 for those.
export function totals(entries = []) {
  return entries.reduce(
    (t, e) => ({ kcal: t.kcal + e.kcal, p: round1(t.p + e.p), c: round1(t.c + (e.c ?? 0)), f: round1(t.f + (e.f ?? 0)) }),
    { kcal: 0, p: 0, c: 0, f: 0 }
  );
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

// Same numbers as logging the meal would give.
export function mealTotals(meal) {
  return totals(meal.items.map(([id, qty, portion = 0]) => makeEntry(id, foods[id], qty, 0, { portion })));
}

// Three ideas that fit the goal and the time of day; they change from day to day.
export function refuelIdeas(goal = 'maintain', date = new Date(), count = 3) {
  const when = timeOfDay(date);
  let list = meals.filter((m) => m.goal === goal && m.when.includes(when));
  if (list.length < count) list = [...list, ...meals.filter((m) => m.goal === goal && !list.includes(m))];
  const start = Math.floor(date.getTime() / 86400000) % list.length;
  return Array.from({ length: Math.min(count, list.length) }, (_, i) => list[(start + i) % list.length]);
}
