import { before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { PAIN_AREAS, alternativesFor, comeback, foodTips, plateaus, routeQuestion, upcomingExercises } from '../src/lib/coach.js';
import { exerciseMeta } from '../src/data/exerciseMeta.js';
import { exercises } from '../src/data/workouts.js';
import { emptyProgress, freezeToday, profileFor } from './helpers.js';

before(() => freezeToday('2026-10-20T09:00:00')); // day 8 of a plan started 12 Oct

describe('understanding questions', () => {
  test('typed questions go to the right topic', () => {
    assert.equal(routeQuestion('My knee hurts when I squat'), 'pain');
    assert.equal(routeQuestion('I am so sore after legs day'), 'soreness');
    assert.equal(routeQuestion("I can't do pull-ups, I have no bar"), 'swap');
    assert.equal(routeQuestion('I missed a whole week'), 'comeback');
    assert.equal(routeQuestion('What should I eat after training?'), 'food');
    assert.equal(routeQuestion('My bench press is stuck'), 'plateau');
    assert.equal(routeQuestion('Who won the football match?'), null);
  });
});

describe('swapping exercises', () => {
  test('home members only get moves they can do at home, never harder ones', () => {
    const home = profileFor({ lookingFor: 'Home workout' });
    const alts = alternativesFor('pushup', home);
    assert.ok(alts.length > 0 && alts.length <= 3);
    for (const id of alts) {
      assert.equal(exerciseMeta[id].muscles[0], 'Chest');
      assert.doesNotMatch(exerciseMeta[id].equipment, /machine|barbell|dumbbell|cable/i);
      assert.ok(exerciseMeta[id].level <= exerciseMeta.pushup.level);
    }
  });

  test('gym members can be offered gym kit', () => {
    const alts = alternativesFor('legPress', profileFor({ lookingFor: 'Gym work' }));
    assert.ok(alts.every((id) => exerciseMeta[id].muscles[0] === 'Legs'));
  });

  test('the week ahead lists each exercise once', () => {
    const list = upcomingExercises(profileFor({ lookingFor: 'Home workout' }));
    const ids = list.map((e) => e.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.includes('pullup'));
  });

  test('every pain area points at real exercises', () => {
    for (const area of Object.values(PAIN_AREAS)) for (const id of area.gentler) assert.ok(exercises[id], `${area.label}: ${id}`);
  });
});

describe('coming back after missed days', () => {
  const profile = profileFor();
  test('no workouts yet → first-workout advice', () => {
    assert.equal(comeback(profile, emptyProgress()).off, null);
  });
  test('a couple of days off → carry on', () => {
    assert.match(comeback(profile, { ...emptyProgress(), done: { 5: true } }).title, /3 days off: you’re fine/);
  });
  test('two weeks off → restart gently', () => {
    assert.match(comeback(profile, { ...emptyProgress(), done: { 0: true } }, 20).title, /restart gently/);
  });
});

describe('food and plateaus', () => {
  test('food tips include the member’s own protein target and goal-based ideas', () => {
    const tips = foodTips(profileFor({ weight: '70', goals: ['Build muscle'] }));
    assert.equal(tips.protein, 140);
    assert.match(tips.ideas[0], /protein at every meal/);
    assert.match(foodTips(profileFor({ goals: ['Lose fat'] })).ideas[0], /sukuma/);
  });

  test('an exercise stuck for 3 sessions is flagged; an improving one is not', () => {
    const sets = (w, r) => [{ w, r }, { w, r }];
    const lifts = {
      backSquat: { 0: sets(60, 8), 2: sets(60, 8), 4: sets(60, 8), 6: sets(60, 7) },
      pushup: { 0: sets(null, 8), 2: sets(null, 9), 4: sets(null, 10), 6: sets(null, 11) },
    };
    const found = plateaus({ ...emptyProgress(), lifts });
    assert.deepEqual(found.map((p) => p.id), ['backSquat']);
    assert.match(found[0].tip, /2\.5 kg/);
  });
});
