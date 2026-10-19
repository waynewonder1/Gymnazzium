// The free "smart coach": answers common questions from the member's own plan and logs.
// No AI and no network: plain rules over data the app already has. When an AI coach is added
// later, questions this can't answer (routeQuestion → null) are the ones to send to it.
import { exercises } from '../data/workouts.js';
import { exerciseMeta } from '../data/exerciseMeta.js';
import { getDay, nutrition, todayIndex } from './plan.js';
import { history } from './lifts.js';
import { runHistory } from './runs.js';

// ---------- Understanding a typed question ----------
const TOPICS = [
  ['pain', /hurt|pain|injur|ache in|aching|twist|sprain|knee|back pain|lower back|shoulder|wrist|elbow|ankle/i],
  ['soreness', /sore|doms|stiff|tight muscles|muscles? (are|feel)/i],
  ['swap', /can'?t do|cannot do|too hard|easier|alternative|instead|replace|swap|no (pull[- ]?up )?bar|no equipment|don'?t have/i],
  ['comeback', /miss|skipp|back on track|restart|start again|fell off|lazy|motivat|haven'?t trained|break/i],
  ['food', /eat|food|diet|meal|protein|calorie|hungry|breakfast|lunch|dinner|snack|water|drink/i],
  ['plateau', /stuck|plateau|not improving|no progress|same weight|same reps|not getting|slow progress|stronger|faster/i],
];

export function routeQuestion(text) {
  const match = TOPICS.find(([, pattern]) => pattern.test(text));
  return match ? match[0] : null;
}

// ---------- Swapping an exercise ----------
const GYM_KIT = /machine|barbell|cable|dumbbell|ez bar|rack|bench \+/i;
const primaryMuscle = (id) => exerciseMeta[id]?.muscles?.[0];

// Up to 3 other moves for the same main muscle the member can do where they train,
// easiest first (never harder than the one they're replacing).
export function alternativesFor(id, profile) {
  const muscle = primaryMuscle(id);
  if (!muscle) return [];
  const level = exerciseMeta[id].level;
  const gym = profile.lookingFor === 'Gym work';
  return Object.keys(exerciseMeta)
    .filter((other) => other !== id && exercises[other] && !['warmup', 'distance'].includes(exercises[other].kind))
    .filter((other) => primaryMuscle(other) === muscle)
    .filter((other) => gym || !GYM_KIT.test(exerciseMeta[other].equipment))
    .filter((other) => exerciseMeta[other].level <= level)
    .sort((a, b) => exerciseMeta[a].level - exerciseMeta[b].level || a.localeCompare(b))
    .slice(0, 3);
}

// The exercises in the member's plan for the next week, to pick one to swap.
export function upcomingExercises(profile, from = Math.max(0, todayIndex(profile))) {
  const seen = new Map();
  for (let i = from; i < from + 7; i++) {
    const day = getDay(profile, i);
    if (day.type !== 'train') continue;
    for (const item of day.items) if (exerciseMeta[item.id] && !seen.has(item.id)) seen.set(item.id, item.name);
  }
  return [...seen].map(([id, name]) => ({ id, name }));
}

// ---------- Pain ----------
// General guidance only. Gentler moves for each area come from the exercise library.
export const PAIN_AREAS = {
  knee: { label: 'Knee', avoid: 'deep lunges, jump squats, sprints and deep squats', gentler: ['gluteBridge', 'wallSit', 'homeCalfRaise', 'legRaise'] },
  back: { label: 'Lower back', avoid: 'Romanian deadlifts, bent-over rows, heavy squats and sit-ups', gentler: ['gluteBridge', 'plank', 'sidePlank', 'crucifixHold'] },
  shoulder: { label: 'Shoulder', avoid: 'pike push-ups, dips, overhead presses and wide push-ups', gentler: ['inclinePushup', 'tableRow', 'gluteBridge', 'plank'] },
  wrist: { label: 'Wrist', avoid: 'push-ups on flat hands, handstands and crow pose', gentler: ['plank', 'gluteBridge', 'squat', 'legRaise'] },
  elbow: { label: 'Elbow', avoid: 'dips, diamond push-ups, triceps extensions and heavy curls', gentler: ['inclinePushup', 'squat', 'gluteBridge', 'plank'] },
  ankle: { label: 'Ankle', avoid: 'jump rope, sprints, jump squats and burpees', gentler: ['gluteBridge', 'plank', 'tableRow', 'pushup'] },
};

export const SEE_A_DOCTOR = [
  'The pain is sharp, or gets worse during or after training',
  'There is swelling, a pop you heard, or you can’t put weight on it',
  'Numbness, tingling or weakness',
  'It hasn’t improved after 1–2 weeks of rest',
];

// ---------- Missed days ----------
export function comeback(profile, progress, today = todayIndex(profile)) {
  const doneDays = Object.keys(progress.done ?? {}).map(Number).filter((i) => i <= today);
  const last = doneDays.length ? Math.max(...doneDays) : null;
  const off = last === null ? null : today - last;
  if (last === null) {
    return { off: null, title: 'Let’s get your first workout done', steps: ['Open today’s workout and tap ▶ Start workout.', 'Do what you can: even half the sets counts.', 'Tomorrow, come back and tick it off again. Two days in a row is how habits start.'] };
  }
  if (off <= 3) {
    return { off, title: `${off === 0 ? 'You trained today' : `${off} day${off === 1 ? '' : 's'} off`}: you’re fine`, steps: ['Just do today’s workout as planned. No need to make up missed sessions.', 'Never miss twice in a row: that’s the only rule that matters.'] };
  }
  if (off <= 13) {
    return { off, title: `${off} days off: easy comeback`, steps: ['Do today’s workout, but about 2 fewer reps per set (or a lighter weight).', 'Back to full reps from your next session.', 'Turn on reminders on My plan so the app nudges you at your workout time.'] };
  }
  return { off, title: `${off} days off: restart gently`, steps: ['This week, do every workout at about 70% (fewer reps, lighter weights, shorter runs).', 'Expect some soreness after the first two sessions. That’s normal.', 'Thinking of starting fresh? Edit details on My plan to set a new start date.'] };
}

// ---------- Food ----------
// Rough protein per everyday portion (approximate, varies by brand and size).
export const PROTEIN_FOODS = [
  ['2 eggs', 12],
  ['1 cup cooked beans', 15],
  ['1 cup cooked ndengu (green grams)', 14],
  ['A handful of omena (about 50 g dry)', 30],
  ['500 ml milk or mala', 16],
  ['A piece of chicken (about 100 g)', 27],
  ['A piece of beef (about 100 g)', 26],
  ['A small handful of groundnuts (30 g)', 7],
];

export function foodTips(profile) {
  const n = nutrition(profile);
  const fatLoss = profile.goals.some((g) => ['Lose fat', 'Get toned / defined'].includes(g));
  const muscle = profile.goals.some((g) => ['Build muscle', 'Get stronger'].includes(g));
  const ideas = fatLoss
    ? ['Half your plate sukuma, cabbage or spinach, a quarter protein, a quarter ugali or rice.', 'Swap soda and juice for water. Easy calories saved.', 'Go easy on chapati, mandazi and chips: tasty, but very high in calories.']
    : muscle
      ? ['Eat protein at every meal: eggs at breakfast, beans or ndengu at lunch, meat or omena at supper.', 'Have a snack after training: milk or mala with a banana works well.', 'Don’t skip meals. Building muscle needs enough food.']
      : ['Eat at regular times, with protein and vegetables at each meal.', 'Mostly home-cooked food: ugali or rice, beans or meat, and greens.', 'Keep sugary drinks for treats.'];
  return { ...n, ideas };
}

// ---------- Plateaus ----------
// An exercise is "stuck" when its last 3 sessions didn't beat the best before them.
export function plateaus(progress) {
  const out = [];
  for (const id of Object.keys(progress.lifts ?? {})) {
    const sessions = history(progress.lifts, id);
    if (sessions.length < 4) continue;
    const weighted = sessions.some((s) => s.best.w);
    const value = (s) => (weighted ? s.e1rm : s.best.r);
    const recent = sessions.slice(-3).map(value);
    const before = Math.max(...sessions.slice(0, -3).map(value));
    if (Math.max(...recent) > before) continue;
    const harder = exercises[id]?.advanced;
    out.push({
      id,
      name: exercises[id]?.name ?? id,
      tip: weighted
        ? 'Add 2.5 kg and aim for the bottom of your rep range, or keep the weight and add 1 rep to each set.'
        : harder
          ? `Move up to ${exercises[harder].name}: harder version, same muscles.`
          : 'Slow it down: take 3 seconds on the way down and pause at the bottom. Same reps, much harder.',
    });
  }
  const runs = runHistory(progress.runs);
  if (runs.length >= 4) {
    const paced = runs.filter((r) => r.km >= 1);
    const recent = paced.slice(-3).map((r) => r.pace);
    const before = Math.min(...paced.slice(0, -3).map((r) => r.pace));
    if (recent.length === 3 && Math.min(...recent) >= before) {
      out.push({ id: 'run', name: 'Your running pace', tip: 'Add one short speed session a week (sprints or faster 1-minute pieces) and keep your other runs easy.' });
    }
  }
  return out;
}
