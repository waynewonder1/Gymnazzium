import { before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { badgeInfo, monthKey, monthStats, monthlyChallenges, newBadges } from '../src/lib/challenges.js';
import { getDay } from '../src/lib/plan.js';
import { mergeProgress } from '../src/lib/storage.js';
import { emptyProgress, freezeToday, profileFor } from './helpers.js';

before(() => freezeToday('2026-10-20T09:00:00')); // a Tuesday, in week 2 of a plan started 12 Oct

const profile = profileFor({ startDate: '2026-10-12' });
const OCT = new Date(2026, 9, 20);

// Marks training days done; optionally logs 3 sets of 8 on each exercise.
function trainedOn(indexes, { logSets = false, weight = () => 20 } = {}) {
  const progress = emptyProgress();
  for (const i of indexes) {
    const day = getDay(profile, i);
    if (day.type !== 'train') continue;
    progress.done[i] = true;
    if (logSets) for (const item of day.items) (progress.lifts[item.id] ??= {})[i] = [8, 8, 8].map((r) => ({ w: weight(i), r }));
  }
  return progress;
}

describe('monthly challenges', () => {
  test('are sized to the member’s plan this month', () => {
    const [showUp, unbroken, volume, newBests] = monthlyChallenges(profile, emptyProgress(), OCT);
    const planned = monthStats(profile, emptyProgress(), OCT).planned;
    assert.equal(planned, 15); // 5-day split, 12–31 Oct
    assert.equal(showUp.target, Math.round(planned * 0.75));
    assert.equal(unbroken.target, 10);
    assert.equal(volume.target, 100);
    assert.equal(newBests.target, 3);
    assert.equal(showUp.key, '2026-10:show-up');
  });

  test('none before the plan starts', () => {
    assert.deepEqual(monthlyChallenges(profileFor({ startDate: '2026-12-01' }), emptyProgress(), OCT), []);
  });

  test('a missed past workout breaks the run; today and future days don’t', () => {
    // Trained Mon 12, Tue 13, Thu 15 (missed nothing: Wed is rest), skipped Fri 16, trained Sat 17, Mon 19.
    const stats = monthStats(profile, trainedOn([0, 1, 3, 5, 7]), OCT);
    assert.equal(stats.workouts, 5);
    assert.equal(stats.bestRun, 3); // Mon, Tue, Thu; Fri was missed
  });

  test('counts sets with reps and PRs in the month only', () => {
    const progress = trainedOn([0, 1, 3], { logSets: true, weight: (i) => 20 + i });
    progress.lifts.backSquat[1].push({ w: 30, r: 0 }); // a set with no reps doesn't count
    const stats = monthStats(profile, progress, OCT);
    const sets = [0, 1, 3].reduce((n, i) => n + getDay(profile, i).items.length * 3, 0);
    assert.equal(stats.sets, sets);
    assert.ok(stats.prs > 0); // heavier each session
    assert.equal(monthStats(profile, progress, new Date(2026, 10, 5)).sets, 0); // November
  });
});

describe('badges', () => {
  test('a brand-new member has none to earn', () => {
    assert.deepEqual(newBadges(profile, emptyProgress(), OCT), []);
  });

  test('first workout earns "First workout"', () => {
    assert.deepEqual(newBadges(profile, trainedOn([0]), OCT), ['first-workout']);
  });

  test('badges already earned are never awarded twice', () => {
    const progress = trainedOn([0, 1, 3, 4, 5, 7, 8], { logSets: true, weight: (i) => 20 + i });
    const first = newBadges(profile, progress, OCT);
    assert.ok(first.includes('streak-7') && first.includes('first-pr'));
    const awarded = { ...progress, badges: Object.fromEntries(first.map((k) => [k, '2026-10-20'])) };
    assert.deepEqual(newBadges(profile, awarded, OCT), []);
  });

  test('badgeInfo names milestone and monthly badges', () => {
    assert.equal(badgeInfo('streak-7').title, '7 in a row');
    assert.equal(badgeInfo('2026-10:show-up').title, 'Show up · October 2026');
    assert.equal(badgeInfo('something-else').icon, '🏅');
    assert.equal(monthKey(OCT), '2026-10');
  });
});

describe('syncing progress', () => {
  test('badges from the account and this device are both kept', () => {
    const remote = { ...emptyProgress(), badges: { 'first-workout': '2026-10-12' } };
    const local = { ...emptyProgress(), badges: { 'streak-7': '2026-10-19' } };
    assert.deepEqual(mergeProgress(remote, local).badges, { 'first-workout': '2026-10-12', 'streak-7': '2026-10-19' });
  });
});
