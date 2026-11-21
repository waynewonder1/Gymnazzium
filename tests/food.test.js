import { before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { amountOf, foods } from '../src/data/foods.js';
import { FOOD_GOALS, meals } from '../src/data/meals.js';
import { addCustomFood, addFoods, addGrams, mealTotals, recentFoods, refuelIdeas, removeEntry, timeOfDay, totals } from '../src/lib/food.js';
import { nutrition } from '../src/lib/plan.js';
import { mergeProgress } from '../src/lib/storage.js';
import { emptyProgress, freezeToday, profileFor } from './helpers.js';

before(() => freezeToday());

describe('food data', () => {
  test('every food has per-100 g values that add up, and real portion sizes', () => {
    for (const [id, f] of Object.entries(foods)) {
      assert.ok(f.name && f.cat && f.portions.length > 0, id);
      const { kcal, p, c, f: fat } = f.per100;
      assert.ok(kcal >= 0 && kcal <= 900, `${id}: ${kcal} kcal per 100 g`);
      assert.ok(p + c + fat <= 100, `${id}: more than 100 g of macros in 100 g`);
      // 4 kcal per g of protein and carbs, 9 per g of fat. Beer gets most of its calories from alcohol.
      const fromMacros = p * 4 + c * 4 + fat * 9;
      if (id !== 'beer') assert.ok(Math.abs(fromMacros - kcal) <= Math.max(10, kcal * 0.1), `${id}: macros give ${fromMacros} kcal, listed ${kcal}`);
      for (const portion of f.portions) assert.ok(portion.label && portion.g > 0 && portion.g <= 600, `${id}: ${portion.label}`);
      assert.ok(f.kcal <= 1500, `${id}: usual portion ${f.kcal} kcal`);
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
    // 250 g ugali at 120 kcal/100 g, 2 × 50 g fried egg at 196, 150 g sukuma at 55
    assert.deepEqual(day.map((e) => [e.g, e.kcal]), [[250, 300], [100, 196], [150, 83]]);
    assert.equal(day[1].label, '2 × 1 egg');
    const t = totals(day);
    assert.equal(t.kcal, 579);
    assert.ok(t.p > 0 && t.c > 0 && t.f > 0);
    progress = removeEntry(progress, '2026-10-12', day[1].id);
    assert.equal(totals(progress.meals['2026-10-12']).kcal, 383);
    progress = removeEntry(progress, '2026-10-12', day[0].id);
    progress = removeEntry(progress, '2026-10-12', day[2].id);
    assert.equal(progress.meals['2026-10-12'], undefined, 'an empty day is removed');
  });

  test('other portion sizes, half portions and exact grams; unknown foods are ignored', () => {
    let progress = addFoods(emptyProgress(), 'd', [['chapati', 0.5], ['notAFood', 1], ['ugali', 1, 2]]);
    assert.deepEqual(progress.meals.d.map((e) => [e.name, e.g, e.kcal, e.label]), [
      ['Chapati', 40, 120, '½ × 1 chapati'],
      ['Ugali', 400, 480, '1 large piece'],
    ]);
    progress = addGrams(progress, 'd', 'rice', '180');
    const rice = progress.meals.d.at(-1);
    assert.deepEqual([rice.g, rice.kcal, rice.label], [180, 234, '180 g']);
    assert.deepEqual(rice, { ...rice, ...amountOf(foods.rice, 180) });
    assert.equal(addGrams(progress, 'd', 'rice', '0'), progress, 'nothing logged for 0 g');
    assert.equal(addGrams(progress, 'd', 'notAFood', '100'), progress);
  });

  test('entries logged before carbs and fat were tracked still total', () => {
    const old = [{ id: 'a', kcal: 300, p: 7 }, { id: 'b', kcal: 100, p: 6, c: 1, f: 7.5 }];
    assert.deepEqual(totals(old), { kcal: 400, p: 13, c: 1, f: 7.5 });
  });

  test('your own foods can be added and logged, and show up as recent', () => {
    const { id, progress } = addCustomFood(emptyProgress(), { name: "  Mum's pilau ", portion: '1 plate', kcal: '640', p: '18', c: '80' });
    assert.equal(progress.customFoods[id].name, "Mum's pilau");
    const logged = addFoods(progress, 'd', [[id, 1], ['banana', 1]]);
    // banana: 118 g at 89 kcal / 1.1 g protein / 22.8 g carbs / 0.3 g fat per 100 g
    assert.deepEqual(totals(logged.meals.d), { kcal: 640 + 105, p: 18 + 1.3, c: 80 + 26.9, f: 0.4 });
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
    // Fat is about a quarter of the calories; protein, carbs and fat add up to the target.
    const t = nutrition({ ...base, foodGoal: 'maintain' });
    assert.ok(Math.abs(t.protein * 4 + t.carbs * 4 + t.fat * 9 - t.target) <= 10);
    assert.ok(Math.abs((t.fat * 9) / t.target - 0.25) < 0.01);
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
