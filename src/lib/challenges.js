// Monthly challenges and badges, worked out from a member's own progress.
// Earned badges are kept in progress.badges: { [badgeKey]: 'YYYY-MM-DD' (date earned) }
//   milestone badges: 'workouts-10', 'streak-7', …
//   challenge badges: '2026-10:show-up' (month : challenge id)
import { getDay, parseDate, streak, toISO, todayIndex, totalDays } from './plan.js';
import { isLoggable, prFor } from './lifts.js';
import { runTotals } from './runs.js';

export const monthKey = (date) => toISO(date).slice(0, 7);
export const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};

// Plan day indexes that fall in the calendar month containing `date`.
function monthRange(profile, date) {
  const start = parseDate(profile.startDate);
  const index = (d) => Math.round((d - start) / 86400000);
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { from: Math.max(0, index(first)), to: Math.min(totalDays(profile) - 1, index(next) - 1) };
}

export function monthStats(profile, progress, date = new Date()) {
  const { from, to } = monthRange(profile, date);
  const today = todayIndex(profile);
  let planned = 0;
  let workouts = 0;
  let run = 0;
  let bestRun = 0;
  let loggable = false;
  for (let i = from; i <= to; i++) {
    const day = getDay(profile, i);
    if (day.type === 'rest') continue; // rest days don't break a run
    planned++;
    if (day.items.some((item) => isLoggable(item.id))) loggable = true;
    if (progress.done[i]) {
      workouts++;
      run++;
      bestRun = Math.max(bestRun, run);
    } else if (i < today) {
      run = 0;
    }
  }

  let sets = 0;
  let prs = 0;
  for (const [id, byDay] of Object.entries(progress.lifts ?? {})) {
    for (const [index, logged] of Object.entries(byDay)) {
      const i = Number(index);
      if (i < from || i > to) continue;
      sets += logged.filter((s) => s.r > 0).length;
      if (prFor(progress.lifts, id, i)) prs++;
    }
  }

  return { planned, workouts, bestRun, sets, prs, loggable };
}

const CHALLENGE_INFO = {
  'show-up': { icon: '📅', title: 'Show up' },
  unbroken: { icon: '🔥', title: 'Unbroken' },
  volume: { icon: '🏋️', title: 'Volume' },
  'new-bests': { icon: '🏆', title: 'New bests' },
};

// This month's challenges, sized to the member's own plan. Lifting ones only appear
// when this month's plan has exercises that can be logged.
export function monthlyChallenges(profile, progress, date = new Date()) {
  const s = monthStats(profile, progress, date);
  if (s.planned === 0) return [];
  const month = date.toLocaleDateString('en-GB', { month: 'long' });
  const showUp = Math.max(1, Math.round(s.planned * 0.75));
  const inARow = Math.min(10, s.planned);

  const list = [
    { id: 'show-up', goal: `Do ${showUp} workouts in ${month}`, note: `That's 3 in 4 of the ${s.planned} on your plan this month.`, target: showUp, value: s.workouts },
    { id: 'unbroken', goal: `Do ${inARow} workouts in a row`, note: "Rest days don't break the run; a missed workout does.", target: inARow, value: s.bestRun },
  ];
  if (s.loggable) {
    list.push(
      { id: 'volume', goal: 'Log 100 sets', note: 'Every set with reps counts.', target: 100, value: s.sets },
      { id: 'new-bests', goal: 'Hit 3 PRs', note: 'Beat your heaviest weight, strongest set or most reps.', target: 3, value: s.prs }
    );
  }
  return list.map((c) => ({ ...c, ...CHALLENGE_INFO[c.id], key: `${monthKey(date)}:${c.id}`, done: c.value >= c.target }));
}

// ---------- Milestone badges ----------
export const MILESTONES = [
  { id: 'first-workout', icon: '👟', title: 'First workout', how: 'Finish your first workout.', test: (t) => t.workouts >= 1 },
  { id: 'workouts-10', icon: '💪', title: '10 workouts', how: 'Finish 10 workouts.', test: (t) => t.workouts >= 10 },
  { id: 'workouts-50', icon: '🦾', title: '50 workouts', how: 'Finish 50 workouts.', test: (t) => t.workouts >= 50 },
  { id: 'workouts-100', icon: '👑', title: '100 workouts', how: 'Finish 100 workouts.', test: (t) => t.workouts >= 100 },
  { id: 'streak-7', icon: '🔥', title: '7 in a row', how: 'Reach a streak of 7 workouts.', test: (t) => t.streak >= 7 },
  { id: 'streak-30', icon: '☄️', title: '30 in a row', how: 'Reach a streak of 30 workouts.', test: (t) => t.streak >= 30 },
  { id: 'first-pr', icon: '🏆', title: 'First PR', how: 'Beat one of your own bests.', test: (t) => t.prs >= 1 },
  { id: 'prs-10', icon: '🥇', title: '10 PRs', how: 'Hit 10 personal records.', test: (t) => t.prs >= 10 },
  { id: 'first-run', icon: '🏃', title: 'First run', how: 'Log your first run.', test: (t) => t.runs.count >= 1 },
  { id: 'run-5k', icon: '🎽', title: '5 km run', how: 'Log a run of 5 km or more.', test: (t) => t.runs.longest >= 5 },
  { id: 'run-10k', icon: '🏅', title: '10 km run', how: 'Log a run of 10 km or more.', test: (t) => t.runs.longest >= 10 },
];

function totals(profile, progress) {
  let prs = 0;
  for (const [id, byDay] of Object.entries(progress.lifts ?? {})) {
    for (const index of Object.keys(byDay)) if (prFor(progress.lifts, id, Number(index))) prs++;
  }
  return { workouts: Object.keys(progress.done).length, streak: streak(profile, progress.done), prs, runs: runTotals(progress.runs) };
}

// Badges this progress qualifies for that haven't been awarded yet.
export function newBadges(profile, progress, date = new Date()) {
  const have = progress.badges ?? {};
  const t = totals(profile, progress);
  const earned = [
    ...MILESTONES.filter((m) => m.test(t)).map((m) => m.id),
    ...monthlyChallenges(profile, progress, date).filter((c) => c.done).map((c) => c.key),
  ];
  return earned.filter((key) => !have[key]);
}

// Display info for any badge key.
export function badgeInfo(key) {
  const milestone = MILESTONES.find((m) => m.id === key);
  if (milestone) return { icon: milestone.icon, title: milestone.title };
  const [month, id] = key.split(':');
  const info = CHALLENGE_INFO[id];
  return info ? { icon: info.icon, title: `${info.title} · ${monthLabel(month)}` } : { icon: '🏅', title: key };
}
