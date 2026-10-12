// Turns a member's profile into a day-by-day plan.
// Everything is computed from the profile, so the same profile always gives the same plan.
import { RUN_GOAL, exercises, gymSplit, gymWeek, homeNotes, homeSplit, homeWeek, runLevels, runRules, sessions } from '../data/workouts.js';
import { challenges, milestones, missions, weeklyMission } from '../data/coaching.js';

export const TIMELINE_DAYS = { '1 month': 28, '3 months': 84, '6 months': 182, '1 year+': 364 };

// Which days of each 7-day cycle are training days.
const SCHEDULE_OFFSETS = {
  '2 days a week': [0, 3],
  '3 days a week': [0, 2, 4],
  '4 days a week': [0, 1, 3, 4],
  '5+ days a week': [0, 1, 2, 3, 4],
};
const ACTIVITY_FACTOR = { '2 days a week': 1.375, '3 days a week': 1.45, '4 days a week': 1.55, '5+ days a week': 1.65 };
const LEVEL_FACTOR = { Beginner: 1, Intermediate: 1.5, Advanced: 2 };

// Gym plans: build strength and form first, then go heavy (2 × 6–10) from this day on.
const HEAVY_FROM = { Beginner: 182, Intermediate: 91, Advanced: 0 };

const FAT_GOALS = ['Lose fat', 'Improve stamina'];
const MUSCLE_GOALS = ['Build muscle', 'Get stronger', 'Get toned / defined'];

// ---------- dates ----------
export const parseDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const toISO = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};
const startOfToday = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
export const todayIndex = (profile) =>
  Math.round((startOfToday() - parseDate(profile.startDate)) / 86400000);

export const totalDays = (profile) => TIMELINE_DAYS[profile.timeline] ?? 84;

// ---------- goals ----------
const hasAny = (profile, list) => profile.goals.some((g) => list.includes(g));

function getRotation(profile) {
  if (profile.lookingFor === 'Overall cardio') return ['cardio', 'core', 'cardio', 'fullbody'];
  const fat = hasAny(profile, FAT_GOALS);
  const muscle = hasAny(profile, MUSCLE_GOALS);
  if (fat && muscle) return ['push', 'cardio', 'pull', 'core'];
  if (muscle) return ['push', 'pull', 'core'];
  if (fat) return ['cardio', 'fullbody', 'core'];
  return ['fullbody', 'cardio', 'core'];
}

const isGym = (profile) => profile.lookingFor === 'Gym work';
const isHome = (profile) => profile.lookingFor === 'Home workout';
// A member's own routine (built in the routine editor) replaces the generated plan.
export const usesRoutine = (profile) => profile.planMode === 'custom' && Boolean(profile.routine);
const variantFor = (profile) => (profile.lookingFor === 'Calisthenics' ? 'calisthenics' : 'home');
const trainingDaysPerWeek = (profile) => {
  if (usesRoutine(profile)) return Object.values(profile.routine.days).filter((d) => d?.groups?.some((g) => g.items.length)).length;
  const sessions = (isGym(profile) || isHome(profile) ? gymWeek.days[profile.schedule] : SCHEDULE_OFFSETS[profile.schedule])?.length ?? 3;
  return sessions + runsPerWeek(profile, 7 - sessions);
};

// ---------- running goal ----------
const wantsRuns = (profile) => profile.goals.includes(RUN_GOAL) && Boolean(runLevels[profile.runLevel]);
// 1 run a week when there are only 2 rest days, otherwise 2; at least one full rest day always stays.
const runsPerWeek = (profile, restDays) => (wantsRuns(profile) ? Math.max(0, Math.min(restDays <= 2 ? 1 : 2, restDays - 1)) : 0);
// Rest days that become runs, best first: Wednesday, Saturday, Tuesday, Thursday, Monday, Friday, Sunday.
const RUN_WEEKDAYS = [3, 6, 2, 4, 1, 5, 0];

// Whether the plan's own sessions (before any runs) train on this day.
function trainsOn(profile, index) {
  if (isGym(profile) || isHome(profile)) {
    const days = gymWeek.days[profile.schedule] ?? gymWeek.days['4 days a week'];
    return days.includes(addDays(parseDate(profile.startDate), index).getDay());
  }
  return (SCHEDULE_OFFSETS[profile.schedule] ?? [0, 2, 4]).includes(index % 7);
}

function isRunDay(profile, index) {
  if (!wantsRuns(profile)) return false;
  if (trainsOn(profile, index)) return false;
  // Look at the whole Monday–Sunday week this day sits in, inside the plan.
  const weekday = addDays(parseDate(profile.startDate), index).getDay();
  const monday = index - ((weekday + 6) % 7);
  const total = totalDays(profile);
  const rest = [];
  for (let i = Math.max(0, monday); i < Math.min(monday + 7, total); i++) if (!trainsOn(profile, i)) rest.push(i);
  const weekdayOf = (i) => (i - monday + 1) % 7;
  const runs = rest
    .sort((a, b) => RUN_WEEKDAYS.indexOf(weekdayOf(a)) - RUN_WEEKDAYS.indexOf(weekdayOf(b)))
    .slice(0, runsPerWeek(profile, rest.length));
  return runs.includes(index);
}

// Distance for this phase of the plan; the last step repeats once it's reached.
export function runStep(profile, phase) {
  const steps = runLevels[profile.runLevel].steps;
  return steps[Math.min(phase, steps.length - 1)];
}

function runDay(profile, base) {
  const { km, rule } = runStep(profile, base.phase);
  const ex = exercises.run;
  return {
    ...base,
    type: 'train',
    sessionKey: 'run',
    title: `Run day: ${km} km`,
    focus: `${km} km, ${runRules[rule].label}, working towards ${runLevels[profile.runLevel].target}`,
    warmup: '5 min brisk walk, then leg swings and 1 minute of very easy jogging.',
    items: [{ id: 'run', name: ex.name, cue: ex.cue, dose: `${km} km · ${runRules[rule].label}`, note: runRules[rule].note }],
    cooldown: '5 min walk, then stretch your calves, hamstrings and quads. Drink water.',
    minutes: 15 + km * 7,
  };
}

// ---------- nutrition ----------
export function nutrition(profile) {
  const w = Number(profile.weight);
  const h = Number(profile.height);
  const a = Number(profile.age);
  const sexOffset = profile.gender === 'Male' ? 5 : profile.gender === 'Female' ? -161 : -78;
  const bmr = 10 * w + 6.25 * h - 5 * a + sexOffset; // Mifflin–St Jeor
  const tdee = bmr * (ACTIVITY_FACTOR[profile.schedule] ?? 1.45);

  const fat = hasAny(profile, ['Lose fat']);
  const muscle = hasAny(profile, ['Build muscle', 'Get stronger']);
  const toned = profile.goals.includes('Get toned / defined');
  let adjustment = 0;
  if (fat && muscle) adjustment = -300;
  else if (fat) adjustment = -500;
  else if (toned) adjustment = -250;
  else if (muscle) adjustment = 250;

  // Never recommend starving: keep a sensible floor.
  const floor = profile.gender === 'Female' ? 1200 : profile.gender === 'Male' ? 1500 : 1350;
  const round10 = (n) => Math.round(n / 10) * 10;

  return {
    bmr: round10(bmr),
    maintenance: round10(tdee),
    target: round10(Math.max(tdee + adjustment, floor)),
    adjustment,
    protein: Math.round(w * (muscle || toned ? 2 : 1.6)),
    // 35 ml per kg, kept within the 2–3 L a day we recommend.
    water: Math.min(3, Math.max(2, Math.round(w * 0.035 * 10) / 10)),
    bmi: Math.round((w / (h / 100) ** 2) * 10) / 10,
  };
}

// What's realistic in the chosen timeline. Deliberately conservative.
export function expectations(profile) {
  const days = totalDays(profile);
  const weeks = days / 7;
  const months = days / 30;
  const w = Number(profile.weight);
  const h = Number(profile.height) / 100;
  const out = [];

  if (hasAny(profile, ['Lose fat', 'Get toned / defined'])) {
    const roomToLose = Math.max(0, w - 22 * h * h); // distance to a mid-healthy BMI
    const lo = Math.min(roomToLose, weeks * 0.25);
    const hi = Math.min(roomToLose, weeks * 0.75);
    out.push(
      roomToLose < 1
        ? { label: 'Fat loss', value: 'Focus on definition', note: "Your weight is already in a healthy range. Aim to lose fat and gain muscle at the same time, and don't chase the scale." }
        : { label: 'Fat loss', value: `${lo.toFixed(0)}–${hi.toFixed(0)} kg`, note: '0.25–0.75 kg a week is a safe pace you can keep up.' }
    );
  }
  if (hasAny(profile, ['Build muscle', 'Get stronger'])) {
    const rate = { Beginner: [0.5, 1], Intermediate: [0.25, 0.5], Advanced: [0.1, 0.25] }[profile.level] ?? [0.5, 1];
    out.push({
      label: 'Muscle gained',
      value: `${(months * rate[0]).toFixed(1)}–${(months * rate[1]).toFixed(1)} kg`,
      note: `A realistic rate at ${(profile.level || 'beginner').toLowerCase()} level with good protein and sleep.`,
    });
  }
  if (hasAny(profile, ['Improve stamina', 'General health'])) {
    out.push({
      label: 'Stamina',
      value: weeks >= 8 ? '30 min non-stop jog' : '15–20 min jog',
      note: 'If you train consistently. Most people notice easier stairs within 2–3 weeks.',
    });
  }
  if (wantsRuns(profile)) {
    const lastPhase = Math.floor((days - 1) / 21);
    const { km, rule } = runStep(profile, lastPhase);
    const level = runLevels[profile.runLevel];
    const reached = lastPhase >= level.steps.length - 1;
    out.push({
      label: 'Running',
      value: `${km} km, ${runRules[rule].label}`,
      note: reached ? `Your target: ${level.target}. Your runs build up to it every 3 weeks.` : `On the way to ${level.target}. A longer timeline gets you all the way there.`,
    });
  }
  out.push({
    label: 'Sessions',
    value: `${Math.round(weeks * trainingDaysPerWeek(profile))}`,
    note: 'Total workouts in your timeline if you never miss one.',
  });
  return out;
}

// ---------- daily plan ----------
function prescribe(ex, phase, level) {
  const sets = ex.sets ?? 3;
  if (ex.kind === 'warmup') return { dose: '2 × 12–15 light', note: null };
  if (ex.kind === 'distance') return { dose: '1–10 km', note: 'Build up slowly: run too far too soon and your shins and knees pay for it.' };
  if (ex.kind === 'weight') {
    return { dose: '3 × 8–12 reps', note: 'Pick a weight that makes rep 12 hard. When you can do 12 on every set, go heavier.' };
  }
  const start = ex.kind === 'minutes' ? ex.base : Math.round(ex.base * (LEVEL_FACTOR[level] ?? 1));
  const raw = start + ex.step * phase;
  const value = Math.min(raw, ex.max);
  const capped = raw > ex.max;
  const unit = ex.unit ?? { reps: 'reps', hold: 's hold', minutes: 'min' }[ex.kind];
  return {
    dose: sets > 1 ? `${sets} × ${value} ${unit}` : `${value} ${unit}`,
    note: capped ? 'Too easy now? Move to a harder variation.' : null,
  };
}

function pickExercise(id, level, phase) {
  const ex = exercises[id];
  if (level === 'Beginner' && phase === 0 && ex.beginner) return ex.beginner;
  if (level === 'Advanced' && ex.advanced) return ex.advanced;
  return id;
}

function fill(text, profile) {
  const n = nutrition(profile);
  return text.replace('{water}', n.water).replace('{protein}', n.protein);
}

function missionFor(profile, index) {
  if (index % 7 === 6) return weeklyMission;
  const list = missions.filter((m) => !m.for || hasAny(profile, m.for));
  return fill(list[index % list.length].text, profile);
}

function obstacleFor(profile, index) {
  if (isGym(profile) && index > 0 && index === heavyFrom(profile) - 1) {
    return { title: 'Heavy phase starts tomorrow', text: 'Your form is solid now. From tomorrow: 2 heavy sets of 6–10 reps per exercise. Warm up well and keep the reps clean.' };
  }
  const milestone = milestones.find((m) => m.day === index && !(m.levelUp && isGym(profile)));
  if (milestone) return milestone;
  // Once a week, remind them of one of their own challenges.
  const own = profile.challenges ?? [];
  if (index % 7 === 3 && own.length) {
    const name = own[Math.floor(index / 7) % own.length];
    return { title: name, text: challenges[name] };
  }
  return null;
}

// ---------- gym split ----------
const heavyFrom = (profile) => HEAVY_FROM[profile.level] ?? HEAVY_FROM.Beginner;

// Which split session falls on this date, or null for a rest day (gymWeek or homeWeek).
function splitSessionFor(week, profile, date, index) {
  const days = week.days[profile.schedule] ?? week.days['4 days a week'];
  if (!days.includes(date.getDay())) return null;
  if (days.length === 5) return week.byDay[date.getDay()];
  // Fewer training days: work through the split in order so every session comes round.
  const start = parseDate(profile.startDate);
  let count = 0;
  for (let i = 0; i < index; i++) if (days.includes(addDays(start, i).getDay())) count++;
  return week.order[count % week.order.length];
}

export function phaseInfo(profile, index) {
  if (usesRoutine(profile)) {
    const n = trainingDaysPerWeek(profile);
    return { label: 'Your routine', value: `${n} day${n === 1 ? '' : 's'} a week`, note: 'Edit it any time' };
  }
  if (isGym(profile)) {
    const from = heavyFrom(profile);
    const left = from - index;
    return index < from
      ? { label: 'Strength & form', value: `${left} day${left === 1 ? '' : 's'}`, note: 'Until your heavy phase (2 × 6–10)' }
      : { label: 'Heavy phase', value: '2 × 6–10', note: 'Heavy, clean reps. Only 2 sets.' };
  }
  const i = Math.max(0, index);
  return { label: `Phase ${Math.floor(i / 21) + 1}`, value: `${21 - (i % 21)} days`, note: 'Until your reps go up' };
}

function gymDay(profile, index, base) {
  const key = splitSessionFor(gymWeek, profile, base.date, index);
  if (!key) {
    return {
      ...base,
      type: 'rest',
      title: 'Rest & recovery',
      focus: 'Sleep 8 hours, drink 2–3 L of water, eat your protein. Recovery is when the muscle grows.',
    };
  }
  const session = gymSplit[key];
  const heavy = index >= heavyFrom(profile);
  const items = session.groups.flatMap((group) =>
    group.ids.map((id) => {
      const ex = exercises[id];
      const dose = ex.kind === 'warmup' ? '2 × 12–15 light' : heavy ? '2 × 6–10 heavy' : '3 × 8–12 reps';
      return { id, name: ex.name, cue: ex.cue, dose, note: null, group: group.name };
    })
  );
  return {
    ...base,
    type: 'train',
    sessionKey: key,
    title: session.title,
    focus: session.focus,
    warmup: session.warmup,
    phaseNote: heavy
      ? 'Heavy phase: 2 sets of 6–10. Pick a weight where the last rep is a real grind with clean form.'
      : 'Strength & form phase: 3 sets of 8–12. Nail the form first. When every set hits 12, add weight.',
    items,
    cooldown: '5 min cool-down: stretch what you trained, then drink water.',
    minutes: 10 + items.length * 5,
  };
}

// ---------- home split ----------
// Same weekdays as the gym split; doses climb every 3 weeks like the other bodyweight plans.
function homeDay(profile, index, base) {
  const key = splitSessionFor(homeWeek, profile, base.date, index);
  if (!key) return restDay(profile, base);
  const session = homeSplit[key];
  const dayIds = session.groups.flatMap((g) => g.ids);
  const items = session.groups.flatMap((group) =>
    group.ids.map((rawId) => {
      // Easier/harder swaps for the member's level, unless that move is already in today's session.
      const swapped = pickExercise(rawId, profile.level, base.phase);
      const id = swapped !== rawId && dayIds.includes(swapped) ? rawId : swapped;
      const ex = exercises[id];
      const { dose, note } = prescribe(ex, base.phase, profile.level);
      return { id, name: ex.name, cue: ex.cue, dose, note: homeNotes[id] ?? note, group: group.name };
    })
  );
  return {
    ...base,
    type: 'train',
    sessionKey: key,
    title: session.title,
    focus: session.focus,
    warmup: session.warmup,
    items,
    cooldown: '5 min cool-down: stretch what you trained, then drink water.',
    minutes: 10 + items.length * 4,
  };
}

function restDay(profile, base) {
  const active = hasAny(profile, FAT_GOALS) || profile.lookingFor === 'Overall cardio';
  return {
    ...base,
    type: 'rest',
    title: active ? 'Active recovery' : 'Rest day',
    focus: active
      ? 'Walk 6,000 steps (about 180–300 kcal) and stretch for 10 minutes.'
      : 'Rest, stretch and eat well. Muscle grows on rest days.',
  };
}

// ---------- custom routine ----------
// profile.routine = {
//   days: { 0–6 (Sunday–Saturday): null (rest) | { title, groups: [{ name, items: [{ id, sets, reps }] }] } },
//   customExercises: { [id]: { name, cue } },
// }
export function exerciseInfo(profile, id) {
  return exercises[id] ?? profile.routine?.customExercises?.[id] ?? { name: id, cue: '' };
}

function routineDay(profile, base) {
  const plan = profile.routine.days[base.date.getDay()];
  const groups = (plan?.groups ?? []).filter((g) => g.items.length > 0);
  if (groups.length === 0) {
    return {
      ...base,
      type: 'rest',
      title: 'Rest & recovery',
      focus: 'Sleep 8 hours, drink 2–3 L of water, eat your protein. Recovery is when the muscle grows.',
    };
  }
  const named = groups.length > 1 || Boolean(groups[0].name);
  const items = groups.flatMap((group) =>
    group.items.map((item) => {
      const ex = exerciseInfo(profile, item.id);
      const dose = exercises[item.id]?.kind === 'distance' ? item.reps : `${item.sets} × ${item.reps}`;
      return { id: item.id, name: ex.name, cue: ex.cue, dose, note: null, group: named ? group.name || 'Exercises' : undefined };
    })
  );
  return {
    ...base,
    type: 'train',
    sessionKey: 'routine',
    title: plan.title || 'Training day',
    focus: groups.map((g) => g.name).filter(Boolean).join(', ') || `${items.length} exercises`,
    warmup: '5–10 min warm-up: light cardio, then one light set of your first exercise.',
    items,
    cooldown: '5 min cool-down: stretch what you trained, then drink water.',
    minutes: 10 + items.length * 5,
  };
}

// Default sets × reps for an exercise newly added in the routine editor.
export function defaultsFor(id) {
  const kind = exercises[id]?.kind;
  if (kind === 'hold') return { sets: 3, reps: '30 s' };
  if (kind === 'minutes') return { sets: 1, reps: '10 min' };
  if (kind === 'distance') return { sets: 1, reps: '3 km' };
  if (kind === 'reps') return { sets: 3, reps: '10' };
  return { sets: 3, reps: '8–12' };
}

// Turns "3 × 8–12 reps" into { sets: 3, reps: '8–12' } for the routine editor.
export function parseDose(dose) {
  const m = dose.match(/^(\d+)\s*×\s*(.+)$/);
  if (!m) return { sets: 1, reps: dose.split(' · ')[0].replace(/\s*(reps|sprints)$/, '') };
  return { sets: Number(m[1]), reps: m[2].replace(/\s+(reps|light|heavy)$/, '') };
}

// A starting routine: one week of the member's current plan, or the Gymnazzium gym or home split.
export function routineTemplate(profile, source) {
  const days = { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
  if (source === 'home') {
    for (const [weekday, key] of Object.entries(homeWeek.byDay)) {
      const session = homeSplit[key];
      days[weekday] = {
        title: session.title,
        groups: session.groups.map((g) => ({
          name: g.name,
          items: g.ids.map((id) => ({ id, ...parseDose(prescribe(exercises[id], 0, profile.level).dose) })),
        })),
      };
    }
  } else if (source === 'gym') {
    for (const [weekday, key] of Object.entries(gymWeek.byDay)) {
      const session = gymSplit[key];
      days[weekday] = {
        title: session.title,
        groups: session.groups.map((g) => ({
          name: g.name,
          items: g.ids.map((id) => ({ id, sets: exercises[id].kind === 'warmup' ? 2 : 3, reps: exercises[id].kind === 'warmup' ? '12–15' : '8–12' })),
        })),
      };
    }
  } else if (source === 'current') {
    const plain = { ...profile, planMode: undefined };
    const start = Math.max(0, todayIndex(profile));
    for (let i = start; i < start + 7; i++) {
      const day = getDay(plain, i);
      if (day.type !== 'train') continue;
      const groups = [];
      for (const item of day.items) {
        const name = item.group ?? '';
        let group = groups.at(-1);
        if (!group || group.name !== name) groups.push((group = { name, items: [] }));
        group.items.push({ id: item.id, ...parseDose(item.dose) });
      }
      days[day.date.getDay()] = { title: day.title, groups };
    }
  }
  return { days, customExercises: { ...(profile.routine?.customExercises ?? {}) } };
}

export function getDay(profile, index) {
  const offsets = SCHEDULE_OFFSETS[profile.schedule] ?? [0, 2, 4];
  const week = Math.floor(index / 7);
  const dow = index % 7;
  const phase = Math.floor(week / 3);
  const base = {
    index,
    date: addDays(parseDate(profile.startDate), index),
    week,
    phase,
    mission: missionFor(profile, index),
    obstacle: obstacleFor(profile, index),
  };

  if (usesRoutine(profile)) return routineDay(profile, base);
  if (isRunDay(profile, index)) return runDay(profile, base);
  if (isGym(profile)) return gymDay(profile, index, base);
  if (isHome(profile)) return homeDay(profile, index, base);

  if (!offsets.includes(dow)) return restDay(profile, base);

  const sessionNumber = week * offsets.length + offsets.filter((o) => o < dow).length;
  const rotation = getRotation(profile);
  const key = rotation[sessionNumber % rotation.length];
  const session = sessions[key];
  const ids = session[variantFor(profile)] ?? session.home;

  const items = ids.map((rawId) => {
    const id = pickExercise(rawId, profile.level, phase);
    const ex = exercises[id];
    return { id, name: ex.name, cue: ex.cue, ...prescribe(ex, phase, profile.level) };
  });

  return {
    ...base,
    type: 'train',
    sessionKey: key,
    title: session.title,
    focus: session.focus,
    warmup: '5 min warm-up: easy jump rope or jog, arm circles, leg swings.',
    items,
    cooldown: '5 min cool-down: walk it off and stretch what you trained.',
    minutes: 10 + items.length * 5,
  };
}

// Streak = consecutive completed training days, counting back from today.
// Rest days don't break it. Today only counts once it's done.
export function streak(profile, done) {
  let count = 0;
  let i = todayIndex(profile);
  if (!done[i]) i -= 1;
  for (; i >= 0; i--) {
    const day = getDay(profile, i);
    if (day.type === 'rest') continue;
    if (!done[i]) break;
    count++;
  }
  return count;
}

// Starting dose for one exercise, e.g. for exercise cards outside a plan.
export function doseFor(id, level = 'Beginner', phase = 0) {
  return prescribe(exercises[id], phase, level);
}
