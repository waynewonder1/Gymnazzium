import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { postsFromChange } from '../src/lib/feedPosts.js';
import { shareStats } from '../src/lib/shareCard.js';
import { emptyProgress } from './helpers.js';

const plan = {
  startDate: '2026-10-12',
  dateOf: (i) => `2026-10-${12 + i}`,
  describeDay: (i) => (i === 2 ? null : { title: 'Chest & back', exercises: 7, sets: 21, prs: 1, minutes: 45 }),
};
const kinds = (changes) => changes.map((c) => `${c.action} ${c.kind} ${c.ref}`);

describe('what gets posted', () => {
  test('finishing a workout posts it once, tagged with the plan start date', () => {
    const next = { ...emptyProgress(), done: { 0: true } };
    assert.deepEqual(kinds(postsFromChange(emptyProgress(), next, plan)), ['publish workout 2026-10-12:0']);
    assert.deepEqual(postsFromChange(next, next, plan), []); // saving again posts nothing new
  });

  test('days that aren’t workouts (describeDay → null) are not posted', () => {
    assert.deepEqual(postsFromChange(emptyProgress(), { ...emptyProgress(), done: { 2: true } }, plan), []);
  });

  test('undoing one workout removes its post', () => {
    const before = { ...emptyProgress(), done: { 0: true, 1: true } };
    assert.deepEqual(kinds(postsFromChange(before, { ...emptyProgress(), done: { 0: true } }, plan)), ['remove workout 2026-10-12:1']);
  });

  test('restarting a plan (many cleared at once) keeps the old posts', () => {
    const before = { ...emptyProgress(), done: { 0: true, 1: true, 3: true }, runs: { 2: { km: 5, sec: 1500 }, 9: { km: 3, sec: 900 } } };
    assert.deepEqual(postsFromChange(before, emptyProgress(), plan), []);
  });

  test('logging a run posts it; editing it updates the same post; clearing it removes it', () => {
    const logged = { ...emptyProgress(), runs: { 2: { km: 10, sec: 330 } } };
    const first = postsFromChange(emptyProgress(), logged, plan);
    assert.deepEqual(first, [{ action: 'publish', kind: 'run', ref: '2026-10-12:2', data: { km: 10, sec: 330, date: '2026-10-14' } }]);
    const fixed = { ...emptyProgress(), runs: { 2: { km: 10, sec: 3030 } } };
    assert.deepEqual(kinds(postsFromChange(logged, fixed, plan)), ['publish run 2026-10-12:2']);
    assert.deepEqual(kinds(postsFromChange(fixed, emptyProgress(), plan)), ['remove run 2026-10-12:2']);
  });

  test('new badges are posted, existing ones are not', () => {
    const before = { ...emptyProgress(), badges: { 'first-workout': '2026-10-12' } };
    const next = { ...before, badges: { ...before.badges, 'streak-7': '2026-10-19' } };
    assert.deepEqual(kinds(postsFromChange(before, next, plan)), ['publish badge streak-7']);
  });
});

describe('share card text', () => {
  test('run: distance headline, time and pace', () => {
    assert.deepEqual(shareStats('run', { km: 10, sec: 3030 }), { headline: '10 KM', sub: 'RUN', stats: [['50:30', 'TIME'], ['5:03', 'PACE /KM']] });
    assert.equal(shareStats('run', { km: 5.5, sec: 1650 }).headline, '5.5 KM');
  });

  test('workout: name, sets, exercises and PRs (or minutes when no PR)', () => {
    assert.deepEqual(shareStats('workout', { title: 'Chest & back', exercises: 7, sets: 21, prs: 2 }).stats, [['21', 'SETS'], ['7', 'EXERCISES'], ['2', 'NEW PRS']]);
    assert.deepEqual(shareStats('workout', { title: 'Legs', exercises: 4, sets: 0, prs: 0, minutes: 30 }).stats, [['4', 'EXERCISES'], ['~30', 'MINUTES']]);
    assert.equal(shareStats('workout', { title: 'Chest & back', exercises: 1 }).headline, 'CHEST & BACK');
  });
});
