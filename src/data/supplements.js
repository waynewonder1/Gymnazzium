// Supplements members can add to their daily stack on the Food page.
// Evidence levels follow the Supplements & energy article (/learn/supplements).
// kind: 'daily' = tick once a day · 'shake' = logs a protein shake to the food log · 'caffeine' = counts mg
export const supplements = {
  creatine: {
    name: 'Creatine monohydrate',
    icon: '💪',
    evidence: 'Strong evidence',
    level: 'strong',
    dose: '3–5 g a day',
    when: 'Any time of day, every day (rest days too). It works by building up, so the streak matters more than the timing.',
    kind: 'daily',
  },
  whey: {
    name: 'Protein powder (whey)',
    icon: '🥤',
    evidence: 'Convenient, not magic',
    level: 'ok',
    dose: '1 scoop (about 24 g protein)',
    when: 'Only when food alone doesn’t get you to your protein target. Logging it adds it to today’s food.',
    kind: 'shake',
    food: 'wheyShake',
  },
  caffeine: {
    name: 'Caffeine / pre-workout',
    icon: '☕',
    evidence: 'Works, with limits',
    level: 'ok',
    dose: 'Up to 400 mg a day (200 mg if pregnant)',
    when: '30–60 minutes before training. Stop about 6 hours before bed: bad sleep costs more than caffeine gives.',
    kind: 'caffeine',
  },
  electrolytes: {
    name: 'Electrolytes / ORS',
    icon: '💧',
    evidence: 'Useful for long, sweaty sessions',
    level: 'ok',
    dose: '1 sachet in water',
    when: 'Training over an hour in the heat, or a long run. For a normal session, water is enough.',
    kind: 'daily',
  },
  vitaminD: {
    name: 'Vitamin D',
    icon: '☀️',
    evidence: 'Only if you’re low',
    level: 'maybe',
    dose: 'As your doctor advises',
    when: 'Most people in Kenya who get outside make enough from the sun. Worth it if a blood test shows you’re low.',
    kind: 'daily',
  },
  omega3: {
    name: 'Omega-3 (fish oil)',
    icon: '🐟',
    evidence: 'Food first',
    level: 'maybe',
    dose: '1 capsule a day',
    when: 'Only if you rarely eat fish. Omena, tilapia or sardines twice a week does the same job.',
    kind: 'daily',
  },
  multivitamin: {
    name: 'Multivitamin',
    icon: '💊',
    evidence: 'Food first',
    level: 'maybe',
    dose: '1 a day',
    when: 'Not needed with a varied diet. It can help if you eat very few fruits and vegetables.',
    kind: 'daily',
  },
};

// Not offered in the stack, with the reason.
export const skipList = [
  { name: 'Fat burners', why: 'Little good evidence, sometimes unsafe. A calorie deficit does the job.' },
  { name: '"Testosterone boosters"', why: 'Don’t raise testosterone in healthy men. Spend the money on food.' },
  { name: 'BCAAs', why: 'Pointless if you already eat enough protein.' },
];

// Quick-add buttons for the caffeine counter (typical amounts).
export const caffeineSources = [
  { label: 'Cup of coffee', mg: 95 },
  { label: 'Cup of tea / chai', mg: 40 },
  { label: 'Energy drink (250 ml)', mg: 80 },
  { label: 'Pre-workout scoop', mg: 200 },
];

export const CAFFEINE_LIMIT = 400;
