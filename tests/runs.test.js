import { before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { formatPace, formatRun, formatTime, lastRun, runHistory, runPrFor, runTotals, targetKm } from '../src/lib/runs.js';
import { newBadges } from '../src/lib/challenges.js';
import { mergeProgress } from '../src/lib/storage.js';
import { emptyProgress, freezeToday, profileFor } from './helpers.js';

before(() => freezeToday('2026-10-20T09:00:00'));

// Runs on plan days 2, 9 and 16 (Wednesdays).
const runs = { 2: { km: 3, sec: 1110 }, 9: { km: 4, sec: 1500 }, 16: { km: 4, sec: 1400 } };

describe('run maths', () => {
  test('times and paces read like a running watch', () => {
    assert.equal(formatTime(1110), '18:30');
    assert.equal(formatTime(3725), '1:02:05');
    assert.equal(formatPace(370), '6:10 /km');
    assert.equal(formatRun({ km: 3, sec: 1110 }), '3 km in 18:30 · 6:10 /km');
  });

  test('the target distance comes from the run day', () => {
    assert.equal(targetKm('3 km · one break max'), 3);
    assert.equal(targetKm('2.5 km'), 2.5);
    assert.equal(targetKm('3 × 8–12 reps'), null);
  });

  test('history is oldest first and skips empty entries', () => {
    assert.deepEqual(runHistory({ ...runs, 5: { km: 0, sec: 0 } }).map((r) => r.index), [2, 9, 16]);
    assert.equal(lastRun(runs, 16).index, 9);
    assert.equal(lastRun(runs, 2), null);
  });

  test('totals', () => {
    assert.deepEqual(runTotals(runs), { count: 3, km: 11, longest: 4, bestPace: 350 });
    assert.deepEqual(runTotals(undefined), { count: 0, km: 0, longest: 0, bestPace: null });
  });
});

describe('run personal bests', () => {
  test('the first run only sets the baseline', () => {
    assert.equal(runPrFor(runs, 2), null);
  });

  test('a longer run than ever before is a best', () => {
    assert.deepEqual(runPrFor(runs, 9), { type: 'distance', text: 'Longest run ever: 4 km' });
  });

  test('the same distance at a faster pace is a best', () => {
    assert.deepEqual(runPrFor(runs, 16), { type: 'pace', text: 'Fastest pace ever: 5:50 /km' });
  });

  test('a short, slow run is not', () => {
    assert.equal(runPrFor({ ...runs, 23: { km: 2, sec: 900 } }, 23), null);
  });
});

describe('running badges and syncing', () => {
  const profile = profileFor();

  test('first run, 5 km and 10 km badges', () => {
    const withRuns = (r) => ({ ...emptyProgress(), runs: r });
    assert.ok(newBadges(profile, withRuns({ 2: { km: 3, sec: 1110 } })).includes('first-run'));
    assert.ok(!newBadges(profile, withRuns({ 2: { km: 3, sec: 1110 } })).includes('run-5k'));
    const long = newBadges(profile, withRuns({ 2: { km: 10, sec: 3600 } }));
    assert.ok(long.includes('run-5k') && long.includes('run-10k'));
  });

  test('runs from the account and this device are both kept', () => {
    const remote = { ...emptyProgress(), runs: { 2: { km: 3, sec: 1110 } } };
    const local = { ...emptyProgress(), runs: { 9: { km: 4, sec: 1500 } } };
    assert.deepEqual(Object.keys(mergeProgress(remote, local).runs), ['2', '9']);
  });
});
