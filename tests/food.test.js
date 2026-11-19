import { before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { foods } from '../src/data/foods.js';
import { FOOD_GOALS, meals } from '../src/data/meals.js';
import { addCustomFood, addFoods, mealTotals, recentFoods, refuelIdeas, removeEntry, timeOfDay, totals } from '../src/lib/food.js';
import { nutrition } from '../src/lib/plan.js';
import { mergeProgress } from '../src/lib/storage.js';
import { emptyProgress, freezeToday, profileFor } from './helpers.js';

before(() => freezeToday());

describe('food data', () => {
  test('every food has a name, a portion, and sensible calories and protein', () => {
    for (const [id, f] of Object.entries(foods)) {
      assert.ok(f.name && f.portion && f.cat, id);
      assert.ok(f.kcal >= 0 && f.kcal <= 1500, `${id}: ${f.kcal} kcal`);
      assert.ok(f.p >= 0 && f.p * 4 <= f.kcal + 5, `${id}: protein can't have more calories than the food`);
    }
  });

  test('every meal idea uses foods that exist, for a real goal and time of day', () => {
    for (const m of meals) {
      assert.ok(FOOD_GOALS[m.goal], m.name);
      assert.ok(m.when.every((w) => ['morning', 'afternoon', 'evening'].includes(w)), m.name);
      for (const [id, qty] of m.items) assert.ok(foods[id] && qty > 0, `${m.name}: ${id}`);
    }
  });

  test('meal ideas fit their goal: bulking meals are bigger than cutting meals on average', () => {
    const avg = (goal) => {
      const list = meals.filter((m) => m.goal === goal && !m.when.includes('morning'));
      return list.reduce((s, m) => s + mealTotals(m).kcal, 0) / list.length;
    };
    assert.ok(avg('gain') > avg('maintain') && avg('maintain') > avg('lose'), `${avg('gain')} > ${avg('maintain')} > ${avg('lose')}`);
  });
});

describe('logging food', () => {
  test('adding, totalling and removing entries for a day', () => {
    let progress = emptyProgress();
    progress = addFoods(progress, '2026-10-12', [['ugali', 1], ['eggFried', 2], ['sukuma', 1]]);
    const day = progress.meals['2026-10-12'];
    assert.equal(day.length, 3);
    assert.deepEqual(totals(day), { kcal: 300 + 200 + 80, p: 7 + 12 + 3 });
    progress = removeEntry(progress, '2026-10-12', day[1].id);
    assert.equal(totals(progress.meals['2026-10-12']).kcal, 380);
    progress = removeEntry(progress, '2026-10-12', day[0].id);
    progress = removeEntry(progress, '2026-10-12', day[2].id);
    assert.equal(progress.meals['2026-10-12'], undefined, 'an empty day is removed');
  });

  test('half portions round sensibly; unknown foods are ignored', () => {
    const progress = addFoods(emptyProgress(), 'd', [['chapati', 0.5], ['notAFood', 1]]);
    assert.deepEqual(progress.meals.d.map((e) => [e.name, e.kcal, e.p]), [['Chapati', 125, 3]]);
  });

  test('your own foods can be added and logged, and show up as recent', () => {
    const { id, progress } = addCustomFood(emptyProgress(), { name: "  Mum's pilau ", portion: '1 plate', kcal: '640', p: '18' });
    assert.equal(progress.customFoods[id].name, "Mum's pilau");
    const logged = addFoods(progress, 'd', [[id, 1], ['banana', 1]]);
    assert.deepEqual(totals(logged.meals.d), { kcal: 745, p: 19 });
    assert.deepEqual(new Set(recentFoods(logged)), new Set([id, 'banana']));
  });
});

describe('targets and refuel ideas', () => {
  test('the food goal sets the calorie target: +300 gain, maintenance, -500 lose (never below the floor)', () => {
    const base = profileFor({ goals: ['Get stronger'] });
    const maint = nutrition({ ...base, foodGoal: 'maintain' });
    assert.equal(maint.target, maint.maintenance);
    assert.equal(nutrition({ ...base, foodGoal: 'gain' }).target, maint.maintenance + 300);
    assert.equal(nutrition({ ...base, foodGoal: 'lose' }).target, maint.maintenance - 500);
    const small = profileFor({ weight: '45', height: '150', age: '30', gender: 'Female', schedule: '2 days a week', foodGoal: 'lose' });
    assert.equal(nutrition(small).target, 1200);
  });

  test('three ideas for the goal and the time of day, changing from day to day', () => {
    const morning = new Date('2026-10-12T08:00:00');
    const ideas = refuelIdeas('gain', morning);
    assert.equal(ideas.length, 3);
    assert.equal(timeOfDay(morning), 'morning');
    assert.ok(ideas.every((m) => m.goal === 'gain'));
    assert.ok(ideas.some((m) => m.when.includes('morning')));
    const evening = refuelIdeas('lose', new Date('2026-10-12T19:00:00'));
    assert.ok(evening.every((m) => m.goal === 'lose' && m.when.includes('evening')));
    assert.notDeepEqual(refuelIdeas('lose', new Date('2026-10-13T19:00:00')), evening);
  });
});

describe('syncing keeps food and home-workout days', () => {
  test('mergeProgress keeps meals, own foods and home days from both copies', () => {
    const remote = { ...emptyProgress(), meals: { '2026-10-11': [{ id: 'a' }] }, customFoods: { x: { name: 'X' } }, homeDays: { 3: true } };
    const local = { ...emptyProgress(), meals: { '2026-10-12': [{ id: 'b' }] }, homeDays: { 5: true } };
    const merged = mergeProgress(remote, local);
    assert.deepEqual(Object.keys(merged.meals).sort(), ['2026-10-11', '2026-10-12']);
    assert.ok(merged.customFoods.x);
    assert.deepEqual(merged.homeDays, { 3: true, 5: true });
  });
});
