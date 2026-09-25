// Exercise library used to build personal plans.
//
// kind:  'reps' | 'hold' (seconds) | 'minutes' | 'weight' (3 × 8–12, raise the load instead of reps)
// base:  starting number for a beginner (scaled up for intermediate/advanced)
// step:  how much it goes up every 3 weeks (the guide's progression rule)
// max:   cap — past this, move to a harder variation instead
// sets:  defaults to 3
// beginner / advanced: swap to an easier / harder exercise for that level
export const exercises = {
  // Chest & push
  pushup: { name: 'Push-ups', cue: 'Body in a straight line, chest all the way down.', kind: 'reps', base: 8, step: 3, max: 30, beginner: 'inclinePushup' },
  inclinePushup: { name: 'Incline push-ups', cue: 'Hands on a raised platform (bed frame, bench, table). Easier than normal push-ups.', kind: 'reps', base: 8, step: 3, max: 25 },
  widePushup: { name: 'Wide push-ups', cue: 'Hands wider than shoulders. Mostly lower chest and front delts.', kind: 'reps', base: 6, step: 3, max: 25 },
  narrowPushup: { name: 'Narrow push-ups', cue: 'Hands under your shoulders, elbows tucked. Mid chest and triceps.', kind: 'reps', base: 6, step: 2, max: 25 },
  diamondPushup: { name: 'Diamond push-ups', cue: 'Thumbs and index fingers form a diamond. Upper chest and triceps.', kind: 'reps', base: 5, step: 2, max: 20, beginner: 'narrowPushup' },
  pikePushup: { name: 'Pike push-ups', cue: 'Hips high in an inverted "V", lower your head toward the floor.', kind: 'reps', base: 5, step: 2, max: 15, advanced: 'elevatedPike' },
  elevatedPike: { name: 'Elevated pike push-ups', cue: 'Feet on a raised platform so your upper body is near vertical.', kind: 'reps', base: 4, step: 2, max: 15 },
  tysonPushup: { name: 'Mike Tyson push-ups', cue: 'A squat and a push-up in every rep. Keep moving.', kind: 'reps', base: 6, step: 2, max: 20 },

  // Shoulders (weights)
  shoulderPress: { name: 'Shoulder press', cue: 'Seated, press straight overhead. Moderate weight — protect your back.', kind: 'weight' },
  lateralRaise: { name: 'Lateral raises', cue: 'Raise the dumbbells out to your sides, to shoulder height.', kind: 'weight' },
  frontRaise: { name: 'Front raises', cue: 'Raise the weight in front of you to eye level.', kind: 'weight' },
  rearDeltFly: { name: 'Rear delt fly', cue: 'Bend forward, raise your arms back like flapping wings.', kind: 'weight' },
  bandReverseFly: { name: 'Band reverse fly', cue: 'Step on a resistance band, cross the ends, then fly your arms back.', kind: 'reps', base: 12, step: 3, max: 25 },

  // Back & pull
  dbRow: { name: 'Dumbbell bent-over row', cue: 'One hand on a bench, pull the elbow above your back.', kind: 'weight' },
  barbellRow: { name: 'Barbell bent-over row', cue: 'Hinge forward, pull the bar to your chest, arms at 45–90°.', kind: 'weight' },
  tableRow: { name: 'Table rows', cue: 'Lie under a sturdy table, grip the edge and pull your chest up to it.', kind: 'reps', base: 6, step: 2, max: 20 },
  pullup: { name: 'Pull-ups', cue: 'Full hang to chin over the bar. Use a band or jump up if you can’t yet.', kind: 'reps', base: 3, step: 2, max: 15 },
  deadHang: { name: 'Dead hang', cue: 'Hang from a bar with straight arms. Grip hard.', kind: 'hold', base: 20, step: 10, max: 90 },

  // Forearms & grip
  farmersCarry: { name: "Farmer's carry", cue: 'Carry two full jerricans or buckets. Walk tall, grip hard.', kind: 'hold', base: 30, step: 15, max: 90, unit: 's walk' },
  bookPinch: { name: 'Book / brick pinch', cue: 'Pinch a dictionary or brick between fingers and thumb and hold.', kind: 'hold', base: 20, step: 10, max: 60 },
  fingerPushup: { name: 'Finger push-ups', cue: 'Push-ups on your fingertips. Start from your knees.', kind: 'reps', base: 3, step: 2, max: 15 },
  wristCurl: { name: 'Wrist curls', cue: 'Forearms on a bench, palms up, wrists hanging off. Curl up.', kind: 'weight' },
  reverseWristCurl: { name: 'Reverse wrist curls', cue: 'Same setup, palms facing down.', kind: 'weight' },

  // Arms (weights)
  bicepCurl: { name: 'Bicep curls', cue: 'Elbows pinned to your sides, no swinging.', kind: 'weight' },
  hammerCurl: { name: 'Hammer curls', cue: 'Palms facing each other. Widens the brachialis.', kind: 'weight' },
  concentrationCurl: { name: 'Concentration curls', cue: 'Seated, elbow against your inner thigh, curl slowly.', kind: 'weight' },
  benchDip: { name: 'Bench dips', cue: 'Hands on a bench behind you, lower until elbows reach 90°.', kind: 'reps', base: 8, step: 3, max: 25 },
  overheadExtension: { name: 'Overhead triceps extension', cue: 'One dumbbell in both hands, lower it behind your head.', kind: 'weight' },

  // Gym split (machines, barbells, dumbbells)
  benchPress: { name: 'Bench press (light, warm-up)', cue: 'Light weight, 2 easy sets of 12–15 to warm up the chest and shoulders.', kind: 'warmup' },
  flyWarmup: { name: 'Dumbbell flies (light, warm-up)', cue: 'Light dumbbells, slow and wide. Wake the chest up, don’t tire it.', kind: 'warmup' },
  inclineBench: { name: 'Incline bench press', cue: 'Bench at 30–45°. Lower the bar to your upper chest, press up and slightly back.', kind: 'weight' },
  dbPullover: { name: 'Dumbbell pullover', cue: 'Lie across a bench, arms slightly bent, lower the dumbbell behind your head and pull it back over your chest.', kind: 'weight' },
  chestFly: { name: 'Chest flies', cue: 'Machine or dumbbells. Big hug motion, soft elbows, squeeze the chest at the top.', kind: 'weight' },
  pullupWarmup: { name: 'Pull-ups (warm-up)', cue: '2 easy sets, well short of failure, to warm up the back.', kind: 'warmup' },
  bentRow: { name: 'Machine / bent-over rows', cue: 'Chest up, pull the handles or bar to your lower ribs, squeeze your shoulder blades.', kind: 'weight' },
  rdl: { name: 'Romanian deadlift (RDL)', cue: 'Soft knees, push your hips back, bar close to your legs. Feel the hamstrings stretch, then stand tall.', kind: 'weight' },
  singleArmRow: { name: 'Single-arm dumbbell row', cue: 'One hand and knee on a bench, pull the dumbbell to your hip.', kind: 'weight' },
  machinePullover: { name: 'Machine pullover', cue: 'Arms nearly straight, pull down in an arc and squeeze the lats.', kind: 'weight' },
  backSquat: { name: 'Squats', cue: 'Bar on your upper back, feet shoulder-width, sit down until thighs are parallel, drive up.', kind: 'weight' },
  legExtension: { name: 'Leg extensions', cue: 'Straighten your legs fully, pause and squeeze the quads, lower slowly.', kind: 'weight' },
  lunge: { name: 'Lunges', cue: 'Long step, back knee towards the floor, push through the front heel. Each leg.', kind: 'weight' },
  calfRaise: { name: 'Calf raises', cue: 'Full stretch at the bottom, rise onto your toes, pause at the top.', kind: 'weight' },
  legPress: { name: 'Leg press', cue: 'Feet shoulder-width, lower until knees reach 90°, never lock your knees at the top.', kind: 'weight' },
  hackSquat: { name: 'Hack squats', cue: 'Back flat on the pad, sink deep, drive through your whole foot.', kind: 'weight' },
  hamstringCurl: { name: 'Hamstring curls', cue: 'Curl your heels towards your glutes, squeeze, lower slowly.', kind: 'weight' },
  militaryPress: { name: 'Overhead military press', cue: 'Standing, core tight, press the bar straight overhead. Moderate weight — protect your lower back.', kind: 'weight' },
  tricepsPushdown: { name: 'Triceps push-downs', cue: 'Elbows pinned to your sides, push the rope or bar down, spread at the bottom.', kind: 'weight' },
  tricepsExtension: { name: 'Triceps extensions', cue: 'Overhead with a dumbbell or cable, lower behind your head, extend fully.', kind: 'weight' },
  machineCurl: { name: 'Machine curls', cue: 'Full range, squeeze at the top, lower slowly.', kind: 'weight' },
  ropeCurl: { name: 'Hammer / rope curls', cue: 'Palms facing each other. Builds the brachialis, which widens the arm.', kind: 'weight' },
  preacherCurl: { name: 'Preacher curls', cue: 'Upper arms flat on the pad, curl up, lower all the way down under control.', kind: 'weight' },
  reverseCurl: { name: 'Reverse-grip curls', cue: 'Palms facing down. Builds the brachioradialis on top of the forearm.', kind: 'weight' },
  latPulldown: { name: 'Lat pull-down / weighted pull-ups', cue: 'Wide grip, pull to your upper chest, lean back slightly, elbows down.', kind: 'weight' },
  narrowPulldown: { name: 'Narrow-grip pull-down', cue: 'Close grip handle, pull to your chest, squeeze the lats.', kind: 'weight' },
  machineRow: { name: 'Machine rows (optional)', cue: 'Chest on the pad, pull to your ribs, squeeze the shoulder blades.', kind: 'weight' },

  // Abs
  crunch: { name: 'Crunches', cue: 'On a mat, knees bent, hands at your temples. Upper abs.', kind: 'reps', base: 20, step: 5, max: 40 },
  legRaise: { name: 'Leg raises', cue: 'Lie flat, raise both legs together. Lower abs.', kind: 'reps', base: 5, step: 3, max: 20 },
  mountainClimber: { name: 'Mountain climbers', cue: 'Push-up position, drive your knees to your chest.', kind: 'reps', base: 20, step: 5, max: 40 },
  kneeTuck: { name: 'Knee tucks', cue: 'Upper body slightly raised, feet never touch the floor.', kind: 'reps', base: 15, step: 3, max: 30 },
  crucifixHold: { name: 'Crucifix hold', cue: 'Lie flat, raise your arms and legs, hold.', kind: 'hold', base: 20, step: 10, max: 60 },
  sideTouch: { name: 'Side-to-side touches', cue: 'Crunch position, reach side to side. Obliques.', kind: 'reps', base: 20, step: 5, max: 40 },
  sidePlank: { name: 'Side plank', cue: 'One forearm, body straight, facing sideways. Each side.', kind: 'hold', base: 30, step: 10, max: 60 },
  plank: { name: 'Plank', cue: 'Forearms down, body straight from head to heels.', kind: 'hold', base: 45, step: 15, max: 120, sets: 2 },

  // Cardio & legs
  jumpRope: { name: 'Jump rope', cue: 'Balls of your feet, knees soft, turn from the wrists. 45 s rest between rounds.', kind: 'minutes', base: 1, step: 0.5, max: 3, sets: 5, unit: 'min rounds' },
  jog: { name: 'Jog', cue: 'Easy pace — you should be able to talk.', kind: 'minutes', base: 15, step: 5, max: 40, sets: 1 },
  sprints: { name: 'Sprints', cue: 'Full sprint for 15–20 s, then at least 45 s rest.', kind: 'reps', base: 5, step: 1, max: 10, sets: 1, unit: 'sprints' },
  burpees: { name: 'Burpees', cue: 'Squat, jump back to a push-up, jump up. Steady rhythm.', kind: 'reps', base: 8, step: 2, max: 20 },
  squat: { name: 'Squats', cue: 'Feet shoulder-width, sit back until thighs are parallel.', kind: 'reps', base: 15, step: 5, max: 40 },
};

// Session templates for home, calisthenics and cardio plans. Each path picks its own exercise list.
export const sessions = {
  push: {
    title: 'Push day',
    focus: 'Chest, shoulders & triceps',
    home: ['pushup', 'widePushup', 'diamondPushup', 'pikePushup'],
  },
  pull: {
    title: 'Pull & grip day',
    focus: 'Back, rear delts & forearms',
    home: ['tableRow', 'bandReverseFly', 'farmersCarry', 'bookPinch'],
    calisthenics: ['pullup', 'tableRow', 'deadHang', 'fingerPushup'],
  },
  core: {
    title: 'Core day',
    focus: 'Upper abs, lower abs & obliques',
    home: ['crunch', 'legRaise', 'mountainClimber', 'kneeTuck', 'sideTouch', 'plank'],
  },
  cardio: {
    title: 'Cardio day',
    focus: 'Burn fat, build stamina',
    home: ['jumpRope', 'jog', 'sprints'],
  },
  fullbody: {
    title: 'Full-body circuit',
    focus: 'Everything, fast — doubles as cardio',
    home: ['tysonPushup', 'squat', 'mountainClimber', 'burpees', 'plank'],
  },
};

// The Gymnazzium gym split, used for everyone who picks "Gym work".
// Each session is split into muscle groups; exercises within a group run in order.
const arms = [
  { name: 'Triceps', ids: ['tricepsPushdown', 'tricepsExtension'] },
  { name: 'Biceps', ids: ['machineCurl', 'ropeCurl', 'preacherCurl', 'reverseCurl'] },
];
const chest = { name: 'Chest', ids: ['inclineBench', 'dbPullover', 'chestFly'] };

export const gymSplit = {
  chestBack: {
    title: 'Chest & back',
    focus: 'Chest, then rows for the back',
    warmup: 'Warm up: light bench press and light dumbbell flies for the chest, easy pull-ups for the back.',
    groups: [
      { name: 'Chest warm-up', ids: ['benchPress', 'flyWarmup'] },
      chest,
      { name: 'Back (rows)', ids: ['pullupWarmup', 'bentRow', 'rdl', 'singleArmRow', 'machinePullover'] },
    ],
  },
  legsQuads: {
    title: 'Legs: quads',
    focus: 'Quads and calves',
    warmup: '5 min on the bike or treadmill, then 2 light sets of squats.',
    groups: [{ name: 'Quads', ids: ['backSquat', 'legExtension', 'lunge', 'calfRaise', 'legPress', 'hackSquat'] }],
  },
  chestShouldersArms: {
    title: 'Chest, shoulders & arms',
    focus: 'Chest, shoulders, triceps and biceps',
    warmup: 'Warm up: light bench press and arm circles, then 1 light set of each press.',
    groups: [chest, { name: 'Shoulders', ids: ['militaryPress', 'lateralRaise'] }, ...arms],
  },
  legsHams: {
    title: 'Legs: hamstrings',
    focus: 'Hamstrings, then quads',
    warmup: '5 min on the bike or treadmill, then 2 light sets of hamstring curls.',
    groups: [{ name: 'Hamstrings', ids: ['hamstringCurl', 'backSquat', 'legPress', 'hackSquat'] }],
  },
  backArms: {
    title: 'Back & arms',
    focus: 'Pull day: lats, then triceps and biceps',
    warmup: 'Warm up: 2 easy sets of pull-ups or light pull-downs.',
    groups: [{ name: 'Back (pull day)', ids: ['latPulldown', 'narrowPulldown', 'machineRow'] }, ...arms],
  },
};

// Training weekdays for each schedule (0 = Sunday … 6 = Saturday).
// 5 days is the full split: Mon chest & back, Tue legs, Wed rest, Thu chest/shoulders/arms, Fri legs, Sat back & arms.
export const gymWeek = {
  byDay: { 1: 'chestBack', 2: 'legsQuads', 4: 'chestShouldersArms', 5: 'legsHams', 6: 'backArms' },
  order: ['chestBack', 'legsQuads', 'chestShouldersArms', 'legsHams', 'backArms'],
  days: {
    '2 days a week': [1, 4],
    '3 days a week': [1, 3, 5],
    '4 days a week': [1, 2, 4, 5],
    '5+ days a week': [1, 2, 4, 5, 6],
  },
};
