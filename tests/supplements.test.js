import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { foods } from '../src/data/foods.js';
import { supplements } from '../src/data/supplements.js';
import { addFoods } from '../src/lib/food.js';
import { addCaffeine, caffeineOn, canTakeSupplements, stackOf, streak, takenOn, toggleInStack, toggleTaken } from '../src/lib/supplements.js';
import { mergeProgress } from '../src/lib/storage.js';

const empty = { meals: {}, suppDays: {} };

describe('supplements', () => {
  test('every supplement is complete; the shake points at a real food', () => {
    for (const [id, s] of Object.entries(supplements)) {
      assert.ok(s.name && s.icon && s.dose && s.when && s.evidence, id);
      assert.ok(['daily', 'shake', 'caffeine'].includes(s.kind), id);
      if (s.kind === 'shake') assert.ok(foods[s.food], `${id} logs ${s.food}`);
    }
  });

  test('adding and removing from the stack; unknown ids are dropped', () => {
    let profile = { age: '25', supplements: ['creatine', 'snake-oil'] };
    assert.deepEqual(stackOf(profile), ['creatine']);
    profile = toggleInStack(profile, 'whey');
    assert.deepEqual(stackOf(profile), ['creatine', 'whey']);
    profile = toggleInStack(profile, 'creatine');
    assert.deepEqual(stackOf(profile), ['whey']);
  });

  test('under-18s are not offered supplements', () => {
    assert.equal(canTakeSupplements({ age: '16' }), false);
    assert.equal(canTakeSupplements({ age: '18' }), true);
    assert.equal(canTakeSupplements({}), true);
  });

  test('ticking a day on and off leaves no empty days behind', () => {
    let p = toggleTaken(empty, '2026-11-20', 'creatine');
    assert.equal(takenOn(p, '2026-11-20', 'creatine'), true);
    p = toggleTaken(p, '2026-11-20', 'creatine');
    assert.equal(takenOn(p, '2026-11-20', 'creatine'), false);
    assert.deepEqual(p.suppDays, {});
  });

  test('a protein shake counts as taken once it is in the food log', () => {
    assert.equal(takenOn(empty, '2026-11-20', 'whey'), false);
    const p = addFoods(empty, '2026-11-20', [['wheyShake', 1]]);
    assert.equal(takenOn(p, '2026-11-20', 'whey'), true);
  });

  test('caffeine adds up, never goes below zero, and clears', () => {
    let p = addCaffeine(empty, '2026-11-20', 95);
    p = addCaffeine(p, '2026-11-20', 200);
    assert.equal(caffeineOn(p, '2026-11-20'), 295);
    p = addCaffeine(p, '2026-11-20', -1000);
    assert.equal(caffeineOn(p, '2026-11-20'), 0);
    assert.deepEqual(p.suppDays, {});
  });

  test('streak counts days in a row; not ticked yet today keeps yesterday’s streak', () => {
    let p = empty;
    for (const d of ['2026-11-17', '2026-11-18', '2026-11-19']) p = toggleTaken(p, d, 'creatine');
    assert.equal(streak(p, 'creatine', '2026-11-20'), 3);
    p = toggleTaken(p, '2026-11-20', 'creatine');
    assert.equal(streak(p, 'creatine', '2026-11-20'), 4);
    assert.equal(streak(p, 'creatine', '2026-11-22'), 0, 'a missed day breaks it');
  });

  test('ticks from two devices are merged per day', () => {
    const phone = toggleTaken(empty, '2026-11-20', 'creatine');
    const laptop = toggleTaken(empty, '2026-11-19', 'creatine');
    const merged = mergeProgress(laptop, phone);
    assert.equal(takenOn(merged, '2026-11-19', 'creatine'), true);
    assert.equal(takenOn(merged, '2026-11-20', 'creatine'), true);
  });
});
