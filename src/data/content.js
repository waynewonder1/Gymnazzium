// Content for the detail pages: /paths/:slug, /body-types/:slug and /learn/:slug.
// Facts and figures are paraphrased from the sources listed with each page.
//
// Section types (rendered by pages/Topic.jsx):
//   intro     { text: [] }
//   facts     { heading, items: [{ value, label, source }] }   — numbers count up on screen
//   points    { heading, items: [{ title, text }] }
//   list      { heading, items: [], ordered? }
//   ladder    { heading, note, tracks: [{ name, steps: [] }] }
//   week      { heading, note, days: [{ day, title, detail }] }
//   workout   { heading, note, ids: [exercise ids] }           — with a built-in rest/interval timer
//   compare   { heading, columns: [], rows: [[]] }
//   calculator{ heading }                                      — calories, protein, water, BMI
//   deficit   { heading }                                      — fries vs mash chart
//   guide     { heading, topicIds? }                           — the training guide tabs
//   faq       { heading, items: [{ q, a }] }

const S = {
  who: { label: 'WHO: Physical activity fact sheet', url: 'https://www.who.int/news-room/fact-sheets/detail/physical-activity' },
  whoGuidelines: { label: 'WHO 2020 guidelines on physical activity and sedentary behaviour (Bull et al., BJSM)', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7719906/' },
  nhs: { label: 'NHS: Physical activity guidelines for adults aged 19 to 64', url: 'https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-for-adults-aged-19-to-64/' },
  nhsCalories: { label: 'NHS Better Health: Calories and weight loss', url: 'https://www.nhs.uk/better-health/lose-weight/calorie-counting/' },
  acsm2026: { label: 'ACSM: 2026 resistance training guidelines', url: 'https://acsm.org/resistance-training-guidelines-update-2026/' },
  acsm2009: { label: 'ACSM position stand: Progression models in resistance training (2009)', url: 'https://pubmed.ncbi.nlm.nih.gov/19204579/' },
  pushup: { label: 'Kikuchi & Nakazato (2017): Low-load bench press and push-up induce similar muscle hypertrophy', url: 'https://www.sciencedirect.com/science/article/pii/S1728869X17301028' },
  calisthenics: { label: 'Thomas et al. (2017): Effects of a calisthenics intervention on posture, strength and body composition', url: 'https://journals.sagepub.com/doi/abs/10.3233/IES-170001' },
  hiit: { label: 'HIIT vs moderate continuous training for fat loss: systematic review & meta-analysis (2023)', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10048683/' },
  protein: { label: 'ISSN position stand: Protein and exercise (2017)', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5477153/' },
  creatine: { label: 'ISSN position stand: Safety and efficacy of creatine supplementation (2017)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5469049/' },
  caffeine: { label: 'EFSA: Caffeine', url: 'https://www.efsa.europa.eu/en/topics/topic/caffeine' },
  sleep: { label: 'CDC MMWR: Prevalence of healthy sleep duration among adults', url: 'https://www.cdc.gov/mmwr/volumes/65/wr/mm6506a1.htm' },
  mifflin: { label: 'Frankenfield et al. (2005): Comparison of predictive equations for resting metabolic rate', url: 'https://www.jandonline.org/article/S0002-8223(05)00149-5/abstract' },
  somatotypes: { label: 'BarBend: Are somatotypes relevant in training?', url: 'https://barbend.com/somatotypes-ectomorph-mesomorph-endomorph/' },
};

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
export const pathPages = [
  {
    slug: 'home-workout',
    title: 'Home workout',
    eyebrow: 'Path 01',
    tagline: 'No gym, no membership, no excuses. Your floor is enough.',
    cta: { label: 'Build my home plan', prefill: { lookingFor: 'Home workout' } },
    gearTags: ['Home workout', 'No gym access'],
    sections: [
      {
        type: 'intro',
        text: [
          "Most people think you need a gym to get in shape. You don't. Push-ups, squats, rows under a table and a jump rope cover every major muscle group and your heart and lungs.",
          'The secret is the same as in the gym: make it a little harder over time. At home you do that with more reps, slower reps, or a harder variation.',
        ],
      },
      {
        type: 'facts',
        heading: 'What the research says',
        items: [
          { value: '18.3%', label: 'Growth in chest muscle thickness from 8 weeks of push-ups, vs 19.4% from bench press. The difference was not significant.', source: S.pushup },
          { value: '2+', label: 'Days a week of muscle-strengthening work recommended for adults, and bodyweight exercises count.', source: S.whoGuidelines },
          { value: 'KES 0', label: 'The cost of your first workout. A floor, a table and two water jerricans are enough to start.' },
        ],
      },
      {
        type: 'points',
        heading: 'How to make it work at home',
        items: [
          { title: 'Claim a spot', text: 'About 2 m × 1 m of floor is enough. Train in the same spot at the same time so it becomes a habit.' },
          { title: 'Improvise equipment', text: 'Jerricans for carries, a sturdy table for rows, a chair for dips and incline push-ups, a backpack of books for extra weight.' },
          { title: 'Progress the move, not just the reps', text: 'When you can do 3 × 20 of something, switch to a harder version: incline → normal → diamond → decline → archer push-ups.' },
          { title: 'Mind the neighbours', text: 'Swap jumps for low-impact moves (mountain climbers, fast marching, shadow boxing) if you live upstairs or train early.' },
        ],
      },
      {
        type: 'week',
        heading: 'The home split',
        note: 'The same rhythm as our gym split. Training fewer days? Your plan works through these sessions in order.',
        days: [
          { day: 'Mon', title: 'Chest & back', detail: 'Normal, wide, incline and decline push-ups · pull-ups' },
          { day: 'Tue', title: 'Legs & abs', detail: 'Squats, lunges, Bulgarian split squats, calves · abs' },
          { day: 'Wed', title: 'Rest', detail: 'Recover: sleep, water, protein' },
          { day: 'Thu', title: 'Chest, shoulders & arms', detail: 'Push-ups · pike, bottle laterals, Tyson push-ups · triceps, curls' },
          { day: 'Fri', title: 'Legs & abs', detail: 'Squats, glute bridges, wall sit, calves · abs' },
          { day: 'Sat', title: 'Back & arms', detail: 'Pull-ups · diamond push-ups, triceps extensions, curls' },
          { day: 'Sun', title: 'Rest', detail: 'Recover and get ready for Monday' },
        ],
      },
      { type: 'split', split: 'home', heading: 'Every session, exercise by exercise', note: 'No pull-up bar? Do table rows instead (lie under a sturdy table and pull your chest up to it). Form cues for every move are in your plan and the exercise library.' },
      { type: 'workout', heading: 'Try it now: 20-minute home starter', note: '3 rounds. Rest 60 s between exercises (use the timer).', ids: ['pushup', 'squat', 'tableRow', 'mountainClimber', 'plank'] },
      {
        type: 'faq',
        heading: 'Questions',
        items: [
          { q: 'Can I really build muscle at home?', a: 'Yes. When push-ups are matched to a similar load, they build the chest and triceps about as well as the bench press. The key is to keep making them harder as you get stronger.' },
          { q: 'How long until I see results?', a: 'Most people feel stronger in 2–3 weeks and see visible changes in 8–12 weeks of consistent training and eating well.' },
          { q: "I can't do a single push-up. Where do I start?", a: 'Incline push-ups with your hands on a table or bed. As they get easy, lower the surface until you reach the floor.' },
        ],
      },
    ],
    sources: [S.pushup, S.whoGuidelines],
  },
  {
    slug: 'gym-work',
    title: 'Gym work',
    eyebrow: 'Path 02',
    tagline: 'The Gymnazzium split: 5 days a week, every muscle trained twice.',
    cta: { label: 'Build my gym plan', prefill: { lookingFor: 'Gym work', schedule: '5+ days a week' } },
    gearTags: ['Gym work', 'Build muscle'],
    sections: [
      {
        type: 'intro',
        text: [
          'This is the split we use: chest and back on Monday, legs twice, arms twice, and a rest day in the middle of the week. Every major muscle gets hit about twice a week.',
          'Train 4 to 5 times a week. Build strength and perfect your form first, then go heavy.',
        ],
      },
      {
        type: 'week',
        heading: 'The week',
        days: [
          { day: 'Mon', title: 'Chest & back', detail: 'Incline press, pullovers, flies · rows, RDL' },
          { day: 'Tue', title: 'Legs: quads', detail: 'Squats, extensions, lunges, calves, leg press, hack squats' },
          { day: 'Wed', title: 'Rest', detail: 'Recover: sleep, water, protein' },
          { day: 'Thu', title: 'Chest, shoulders & arms', detail: 'Chest · military press, laterals · triceps, biceps' },
          { day: 'Fri', title: 'Legs: hamstrings', detail: 'Hamstring curls, squats, leg press, hack squats' },
          { day: 'Sat', title: 'Back & arms', detail: 'Pull-downs, narrow pull-downs, rows · triceps, biceps' },
          { day: 'Sun', title: 'Rest', detail: 'Recover and get ready for Monday' },
        ],
      },
      { type: 'split', heading: 'Every session, exercise by exercise', note: 'Form cues for every exercise are in your plan and in the exercise library.' },
      {
        type: 'points',
        heading: 'The rules',
        items: [
          { title: 'Phase 1: strength & form (3–6 months)', text: 'Focus on building strength fast while you learn proper form. 3 sets of 8–12. When every set hits 12 with clean reps, add weight.' },
          { title: 'Phase 2: go heavy', text: 'Once your form is solid, go heavy: only 2 sets of 6–10 reps per exercise. Pick a weight where the last rep is a real grind, but still clean.' },
          { title: 'Hydrate', text: 'Drink 2 to 3 litres of water every day, and more on training days and hot days.' },
          { title: 'Sleep 8 hours', text: 'Muscle is built while you recover, not while you train. Protect your sleep and your rest days.' },
          { title: 'Train 4–5 times a week', text: 'Five days runs the full split. On four days your plan rotates through the sessions, so nothing gets skipped for good.' },
          { title: 'Warm up every time', text: 'Light bench press and flies before chest, easy pull-ups before back, and a light set before your first heavy lift.' },
        ],
      },
      {
        type: 'facts',
        heading: 'Why it works',
        items: [
          { value: '2×', label: 'Training each major muscle group at least twice a week is recommended for growth. This split does that.', source: S.acsm2026 },
          { value: '10', label: 'About 10 hard sets per muscle group per week for muscle growth.', source: S.acsm2026 },
          { value: '8–12', label: 'Reps per set suit beginners building muscle, with 1–2 minutes of rest between sets.', source: S.acsm2009 },
        ],
      },
      { type: 'workout', heading: 'Monday: chest & back', note: 'Warm up first. Rest 90 s between sets; use the timer.', ids: ['inclineBench', 'dbPullover', 'chestFly', 'bentRow', 'rdl', 'singleArmRow', 'machinePullover'] },
      {
        type: 'faq',
        heading: 'Questions',
        items: [
          { q: 'How heavy should I lift?', a: 'For the first 3–6 months: a weight you can move for 8–12 clean reps. After that, heavy: 2 sets of 6–10, where the last rep is a real grind but your form holds.' },
          { q: 'Can I train 4 days instead of 5?', a: 'Yes. Pick 4 days a week when you build your plan and it rotates through the five sessions, so every session still comes round.' },
          { q: 'How long should a session take?', a: 'About 45–60 minutes including the warm-up. Longer is not better if the quality drops.' },
          { q: 'Where is cardio?', a: 'Add a 10–20 minute bike, row or incline walk after lifting if you want to lose fat, or do it on a rest day.' },
        ],
      },
    ],
    sources: [S.acsm2026, S.acsm2009],
  },
  {
    slug: 'calisthenics',
    title: 'Calisthenics',
    eyebrow: 'Path 03',
    tagline: 'Master your own bodyweight, from your first pull-up to handstands.',
    cta: { label: 'Build my calisthenics plan', prefill: { lookingFor: 'Calisthenics' } },
    gearTags: ['Calisthenics'],
    sections: [
      {
        type: 'intro',
        text: [
          'Calisthenics is strength training where your body is the weight. You get stronger by moving up a ladder of harder variations, and some of those rungs look like tricks: muscle-ups, L-sits, handstands.',
          'A pull-up bar (or a sturdy branch) plus a patch of floor is all you need.',
        ],
      },
      {
        type: 'facts',
        heading: 'What the research says',
        items: [
          { value: '0', label: 'Major equipment needed. A calisthenics programme improved posture, strength and body composition in untrained adults.', source: S.calisthenics },
          { value: '2+', label: 'Strength days a week are recommended. Calisthenics counts in full.', source: S.whoGuidelines },
        ],
      },
      {
        type: 'ladder',
        heading: 'The skill ladders',
        note: 'Move up one rung when you can do 3 clean sets of the target. Tap a rung to mark it done.',
        tracks: [
          { name: 'Push', steps: ['Incline push-up', 'Push-up ×10', 'Diamond push-up', 'Archer push-up', 'One-arm push-up'] },
          { name: 'Pull', steps: ['Dead hang 30 s', 'Table rows ×12', 'Pull-up negatives', 'First pull-up', 'Pull-ups ×10', 'Muscle-up'] },
          { name: 'Legs', steps: ['Squat ×20', 'Split squat', 'Bulgarian split squat', 'Assisted pistol', 'Pistol squat'] },
          { name: 'Core', steps: ['Plank 60 s', 'Hollow hold 30 s', 'Hanging knee raise', 'L-sit 10 s', 'Dragon flag'] },
          { name: 'Balance', steps: ['Pike push-up', 'Wall walk', 'Wall handstand 30 s', 'Handstand push-up (wall)', 'Freestanding handstand'] },
        ],
      },
      {
        type: 'week',
        heading: 'The calisthenics split',
        note: 'Your plan follows this week. Training fewer days? It works through these sessions in order.',
        days: [
          { day: 'Mon', title: 'Push', detail: 'Push-ups, diamond and pike push-ups, bench dips, plank' },
          { day: 'Tue', title: 'Pull & core', detail: 'Pull-ups, table rows, dead hang, hanging leg raises' },
          { day: 'Wed', title: 'Rest', detail: 'Recover: sleep, water, protein' },
          { day: 'Thu', title: 'Legs', detail: 'Squats, Bulgarian split squats, lunges, calves, wall sit' },
          { day: 'Fri', title: 'Skills & core', detail: 'Wall handstand, crow pose, L-sit · scapular protractions, side plank' },
          { day: 'Sat', title: 'Full-body circuit', detail: 'Burpees, pull-ups, Tyson push-ups, squats, mountain climbers' },
          { day: 'Sun', title: 'Rest', detail: 'Recover and get ready for Monday' },
        ],
      },
      { type: 'split', split: 'calisthenics', heading: 'Every session, exercise by exercise', note: 'No pull-up bar? Do table rows instead. Form cues for every move are in your plan and the exercise library.' },
      { type: 'workout', heading: 'Try it now: calisthenics fundamentals', note: '3 rounds. Rest 90 s between exercises.', ids: ['pullup', 'pushup', 'squat', 'pikePushup', 'deadHang', 'crucifixHold'] },
      {
        type: 'faq',
        heading: 'Questions',
        items: [
          { q: "I can't do a pull-up. What now?", a: 'Build up with dead hangs, table rows and slow negatives: jump to the top and lower yourself over 3–5 seconds. It can take weeks, which is normal.' },
          { q: 'Can calisthenics build big muscles?', a: 'It builds plenty of muscle, especially in the upper body. For very large legs, most people eventually add weight (a loaded backpack works).' },
          { q: 'Are handstands safe?', a: 'Start facing the wall, learn to cartwheel out, and practise on grass or a mat. Stop if you feel wrist pain.' },
        ],
      },
    ],
    sources: [S.calisthenics, S.whoGuidelines],
  },
  {
    slug: 'overall-cardio',
    title: 'Overall cardio',
    eyebrow: 'Path 04',
    tagline: 'Burn fat, build your engine, and protect your heart.',
    cta: { label: 'Build my cardio plan', prefill: { lookingFor: 'Overall cardio', goals: ['Lose fat', 'Improve stamina'] } },
    gearTags: ['Overall cardio', 'Improve stamina'],
    sections: [
      {
        type: 'intro',
        text: [
          'Cardio is any activity that gets your heart rate up and keeps it there: running, jump rope, cycling, swimming, dancing, football. It burns calories, strengthens your heart, and makes everyday life feel easier.',
        ],
      },
      {
        type: 'facts',
        heading: 'The guidelines',
        items: [
          { value: '150–300', label: 'Minutes of moderate activity per week for adults (or 75–150 minutes of vigorous activity).', source: S.whoGuidelines },
          { value: '31%', label: 'Of adults worldwide, about 1.8 billion people, are not active enough.', source: S.who },
          { value: '4–5', label: 'Days a week is how the NHS suggests spreading your activity (or every day).', source: S.nhs },
        ],
      },
      {
        type: 'points',
        heading: 'How hard is hard enough?',
        items: [
          { title: 'Moderate', text: 'Raises your heart rate and makes you breathe faster and feel warmer. You can still talk. Brisk walking, cycling, dancing.' },
          { title: 'Vigorous', text: "You breathe hard and fast and can't say more than a few words without pausing. Running, skipping, football, swimming." },
          { title: 'Intervals', text: 'Short bursts of vigorous effort with rest in between: sprints, jump rope rounds, burpees.' },
        ],
      },
      {
        type: 'week',
        heading: 'The cardio split',
        note: 'Easy, hard, then long: stamina builds without burning out. Your plan follows this week.',
        days: [
          { day: 'Mon', title: 'Easy run', detail: 'A jog at talking pace' },
          { day: 'Tue', title: 'Jump rope & core', detail: 'Rope rounds · mountain climbers, plank, leg raises' },
          { day: 'Wed', title: 'Rest', detail: 'Or a 30-minute walk' },
          { day: 'Thu', title: 'Speed day', detail: 'Warm-up jog, then short sprints with full recovery' },
          { day: 'Fri', title: 'HIIT circuit', detail: 'Burpees, jump squats, mountain climbers, Tyson push-ups, high knees' },
          { day: 'Sat', title: 'Long run', detail: 'Your longest, slowest run of the week' },
          { day: 'Sun', title: 'Rest', detail: 'Recover and get ready for Monday' },
        ],
      },
      { type: 'split', split: 'cardio', heading: 'Every session, exercise by exercise', note: 'Runs and rounds get longer every 3 weeks in your plan.' },
      {
        type: 'compare',
        heading: 'Intervals (HIIT) vs steady cardio',
        columns: ['', 'HIIT', 'Steady (jog, walk, cycle)'],
        rows: [
          ['Time', '10–25 minutes', '30–60 minutes'],
          ['Fat loss', 'Similar to or slightly better than steady cardio in studies', 'Effective, and easy to do often'],
          ['Feels', 'Very hard, short', 'Comfortable, longer'],
          ['Best for', 'Busy days, building speed', 'Building a base, active recovery'],
        ],
      },
      {
        type: 'list',
        heading: 'Jump rope form',
        ordered: true,
        items: [
          'Rope length: step on the middle; the handles should reach your chest.',
          'Knees slightly bent, landing on the balls of your feet.',
          'Feet slightly apart.',
          'Turn the rope with your wrists, not your arms.',
          'Keep your elbows close to your body.',
        ],
      },
      { type: 'workout', heading: 'Try it now: 15-minute fat burner', note: 'Use the interval timer: 40 s work, 20 s rest.', ids: ['jumpRope', 'burpees', 'mountainClimber', 'sprints'], timer: 'interval' },
      {
        type: 'faq',
        heading: 'Questions',
        items: [
          { q: 'Will cardio kill my muscle gains?', a: 'Not in normal amounts. Keep lifting, eat enough protein, and put hard cardio on different days from heavy leg work if you can.' },
          { q: 'Is fasted cardio better for fat loss?', a: 'Total calories over the week matter far more than timing. Do cardio when it suits you.' },
          { q: "What's the best cardio?", a: "The one you'll actually do. Pick something you enjoy and can repeat several times a week." },
        ],
      },
    ],
    sources: [S.whoGuidelines, S.who, S.nhs, S.hiit],
  },
];

// ---------------------------------------------------------------------------
// Body types
// ---------------------------------------------------------------------------
export const bodyTypePages = [
  {
    slug: 'v-taper',
    title: 'V-taper',
    eyebrow: 'Body type',
    tagline: 'Wide shoulders, wide back, tight waist: the classic athletic shape.',
    cta: { label: 'Build my V-taper plan', prefill: { goals: ['Build muscle', 'Get toned / defined'] } },
    gearTags: ['Calisthenics', 'Build muscle'],
    sections: [
      {
        type: 'intro',
        text: [
          'The V-taper is about proportion: shoulders and back that are wide compared with your waist. You build the top of the V and keep the bottom lean.',
        ],
      },
      {
        type: 'points',
        heading: 'What to prioritise',
        items: [
          { title: 'Side delts', text: 'Lateral raises and pike push-ups make your shoulders wider. This is the fastest way to change your outline.' },
          { title: 'Lats', text: 'Pull-ups, rows and table rows widen your back. Aim for a pull movement in most sessions.' },
          { title: 'Upper chest', text: 'Decline push-ups and incline presses fill out the top of the V.' },
          { title: 'A lean waist', text: "Keep body fat moderate with diet and cardio. Don't overdo heavy side-bends, which can thicken the waist." },
        ],
      },
      { type: 'workout', heading: 'V-taper builder', note: '3 sets each. Rest 60–90 s.', ids: ['pullup', 'lateralRaise', 'pikePushup', 'widePushup', 'bandReverseFly', 'plank'] },
      {
        type: 'list',
        heading: 'Realistic timeline',
        items: ['Weeks 1–4: stronger pulls and presses, better posture.', 'Months 2–4: shoulders start to look broader in photos.', 'Months 6–12+: a clear V, if diet and consistency hold up.'],
      },
    ],
    sources: [S.acsm2026],
  },
  {
    slug: 'the-morphs',
    title: 'The morphs',
    eyebrow: 'Body type',
    tagline: 'Ectomorph, mesomorph, endomorph: what they mean and what they don’t.',
    cta: { label: 'Build a plan for my body', prefill: {} },
    gearTags: [],
    sections: [
      {
        type: 'intro',
        text: [
          'The "morphs" (somatotypes) are three rough body shapes. They are useful for describing where you are starting from, not for deciding where you can end up.',
        ],
      },
      {
        type: 'points',
        heading: 'The three types',
        items: [
          { title: 'Ectomorph', text: 'Naturally slim, narrow frame, finds it hard to gain weight. Tip: eat in a clear surplus, focus on heavier compound lifts, and keep cardio moderate.' },
          { title: 'Mesomorph', text: 'Naturally athletic, gains muscle fairly easily. Tip: you still need a plan. Consistency beats talent.' },
          { title: 'Endomorph', text: 'Stores fat more easily, often strong. Tip: strength train, add regular cardio, and watch carbs and portions.' },
        ],
      },
      {
        type: 'list',
        heading: 'What science says',
        items: [
          "Most people are a mix. Body shape sits on a spectrum, not in three boxes.",
          'Somatotypes describe your current shape; they do not dictate your results.',
          "Genetics, training, diet and sleep decide far more than your 'type'. A slim person who trains progressively and eats enough can build a muscular build.",
        ],
      },
      { type: 'calculator', heading: 'Start with your numbers instead' },
    ],
    sources: [S.somatotypes, S.mifflin],
  },
  {
    slug: 'slim-cut',
    title: 'Slim cut',
    eyebrow: 'Body type',
    tagline: 'Lean, defined and light on your feet: visible abs and muscle definition.',
    cta: { label: 'Build my slim-cut plan', prefill: { goals: ['Lose fat', 'Get toned / defined'] } },
    gearTags: ['Lose fat', 'Get toned / defined'],
    sections: [
      {
        type: 'intro',
        text: [
          'A slim-cut look is moderate muscle with low body fat. You build enough muscle to have shape, then diet away the fat that hides it.',
        ],
      },
      {
        type: 'facts',
        heading: 'The numbers',
        items: [
          { value: '0.5–1', label: 'kg a week is a safe, achievable rate of weight loss.', source: S.nhsCalories },
          { value: '600', label: 'Fewer calories a day than you burn is a sustainable deficit for most people.', source: S.nhsCalories },
          { value: '1.4–2.0', label: 'g of protein per kg of body weight a day helps keep muscle while you lose fat.', source: S.protein },
        ],
      },
      { type: 'deficit', heading: 'How a calorie deficit works' },
      { type: 'workout', heading: 'Lean-and-defined circuit', note: '3 rounds, 45 s rest between moves.', ids: ['tysonPushup', 'squat', 'mountainClimber', 'legRaise', 'burpees', 'sidePlank'] },
      { type: 'calculator', heading: 'Your cut numbers' },
    ],
    sources: [S.nhsCalories, S.protein],
  },
  {
    slug: 'barbarian',
    title: 'The big buff body',
    eyebrow: 'Body type',
    tagline: 'The barbarian: maximum size and strength, head to toe.',
    cta: { label: 'Build my size plan', prefill: { goals: ['Build muscle', 'Get stronger'], lookingFor: 'Gym work' } },
    gearTags: ['Gym work', 'Get stronger'],
    sections: [
      {
        type: 'intro',
        text: [
          'Big and strong means lots of training volume, heavy compound lifts, and enough food to grow. This is a long game measured in years, and it rewards people who show up.',
        ],
      },
      {
        type: 'facts',
        heading: 'The numbers',
        items: [
          { value: '10', label: 'Hard sets per muscle group per week is a good target for growth.', source: S.acsm2026 },
          { value: '80%', label: 'Of your one-rep max (sets of about 5–8) for strength work.', source: S.acsm2026 },
          { value: '7+', label: 'Hours of sleep a night. Adults sleeping less than 7 hours have higher rates of obesity, diabetes and heart disease.', source: S.sleep },
        ],
      },
      {
        type: 'points',
        heading: 'The rules',
        items: [
          { title: 'Eat in a surplus', text: 'Around 250–500 kcal above maintenance. If the scale is not moving up slowly, eat more.' },
          { title: 'Lift heavy compounds', text: 'Squats, presses, rows and deadlifts move the most weight and build the most muscle.' },
          { title: 'Protein every meal', text: 'Aim for 1.6–2.0 g per kg of body weight a day, spread over 3–4 meals of 20–40 g.' },
          { title: 'Recover like it matters', text: 'Sleep, rest days and managing stress are when growth actually happens.' },
        ],
      },
      { type: 'workout', heading: 'Size session', note: '3–4 × 6–10. Rest 2 minutes on heavy sets.', ids: ['barbellRow', 'shoulderPress', 'squat', 'hammerCurl', 'overheadExtension', 'farmersCarry'] },
    ],
    sources: [S.acsm2026, S.protein, S.sleep],
  },
];

// ---------------------------------------------------------------------------
// Learn (what we offer)
// ---------------------------------------------------------------------------
export const learnPages = [
  {
    slug: 'muscle-building',
    title: 'Muscle building',
    eyebrow: 'What we offer',
    tagline: 'Every muscle, how it works, and the exercises that train it.',
    cta: { label: 'Build my muscle plan', prefill: { goals: ['Build muscle'] } },
    gearTags: ['Build muscle'],
    sections: [
      {
        type: 'intro',
        text: [
          'Muscle grows when you ask it to do slightly more than it is used to, give it the protein to repair, and let it rest. Train, eat, sleep, repeat.',
          'The body has many muscles you can train for size and definition: forearms, upper arms, shoulders, chest, back, thighs, calves, abs, obliques, neck and more.',
        ],
      },
      {
        type: 'facts',
        heading: 'Proven basics',
        items: [
          { value: '2×', label: 'A week per muscle group, minimum.', source: S.acsm2026 },
          { value: '10', label: 'Sets per muscle group per week for growth.', source: S.acsm2026 },
          { value: '20–40', label: 'g of protein per meal supports muscle repair.', source: S.protein },
        ],
      },
      { type: 'guide', heading: 'The training guide' },
    ],
    sources: [S.acsm2026, S.protein],
  },
  {
    slug: 'nutrition',
    title: 'Nutrition & diet',
    eyebrow: 'What we offer',
    tagline: "You can't out-train a bad diet. Here's how to eat for your goal.",
    cta: { label: 'Get my daily targets', prefill: {} },
    gearTags: ['Build muscle'],
    sections: [
      { type: 'calculator', heading: 'Your daily numbers' },
      {
        type: 'facts',
        heading: 'The guidelines',
        items: [
          { value: '0.5–1', label: 'kg a week is a safe rate of weight loss, about 600 kcal a day below what you burn.', source: S.nhsCalories },
          { value: '1.4–2.0', label: 'g of protein per kg a day for people who exercise.', source: S.protein },
          { value: '20–40', label: 'g of protein per meal, spread across the day.', source: S.protein },
        ],
      },
      {
        type: 'points',
        heading: 'Protein you can find anywhere',
        items: [
          { title: 'Eggs', text: 'About 6 g of protein each. Cheap, fast, and easy to boil in bulk.' },
          { title: 'Beans & ndengu (green grams)', text: 'Plant protein and fibre. Githeri is a complete, filling meal.' },
          { title: 'Omena & fish', text: 'High in protein and affordable. Fish also brings healthy fats.' },
          { title: 'Chicken, beef, mutton', text: 'About 25–30 g of protein per 100 g cooked. Grill or boil rather than deep-fry.' },
          { title: 'Milk & mala', text: 'Good protein plus calcium. Easy to add to breakfast.' },
          { title: 'Peas, nuts, groundnuts', text: 'Great snacks. Nuts are calorie-dense, so watch portions when cutting.' },
        ],
      },
      { type: 'deficit', heading: 'Fries vs mash: a calorie deficit in practice' },
      {
        type: 'list',
        heading: 'Simple rules',
        items: [
          'Build every meal around a protein, then add vegetables, then a portion of carbs.',
          'To lose fat, cut back on fried food, sugary drinks, white bread and big portions of rice or ugali.',
          'Eat a light, fast-digesting carb such as a banana 30–60 minutes before training.',
          'Drink water through the day, and more on training days and hot days.',
          "Poor sleep makes you more likely to choose high-calorie food, so sleep is part of your diet.",
        ],
      },
      { type: 'guide', heading: 'More from the guide', topicIds: ['nutrition'] },
    ],
    sources: [S.nhsCalories, S.protein, S.mifflin],
  },
  {
    slug: 'supplements',
    title: 'Supplements & energy',
    eyebrow: 'What we offer',
    tagline: 'What works, what doesn’t, and what to skip.',
    cta: { label: 'Build my plan', prefill: {} },
    gearTags: ['Build muscle'],
    sections: [
      {
        type: 'intro',
        text: [
          "Supplements are the last 5%. Training, food and sleep are the other 95%. If those aren't in place, no powder will fix it.",
          'Supplements are loosely regulated. Buy from trusted sellers, and talk to a doctor or pharmacist first, especially if you have a medical condition or take medication.',
        ],
      },
      {
        type: 'points',
        heading: 'The evidence, supplement by supplement',
        items: [
          { title: 'Creatine monohydrate: strong evidence', text: 'The most researched supplement for strength and muscle. 3–5 g a day raises muscle creatine stores over 3–4 weeks. It has been studied for years in healthy people and is well tolerated at these doses.' },
          { title: 'Protein powder: convenient', text: 'Not magic, just protein. Useful if you struggle to hit your daily target from food.' },
          { title: 'Caffeine / pre-workout: works, with limits', text: 'Can make training feel easier. Healthy adults: up to 200 mg in one go and 400 mg a day. Avoid it late in the day, since it harms sleep.' },
          { title: 'Fat burners & "testosterone boosters": skip', text: 'Little good evidence, often expensive, sometimes unsafe. Spend the money on food.' },
        ],
      },
      {
        type: 'facts',
        heading: 'Know the numbers',
        items: [
          { value: '3–5', label: 'g of creatine a day is the standard maintenance dose.', source: S.creatine },
          { value: '400', label: 'mg of caffeine a day is the safe upper limit for healthy adults (about 4 cups of coffee).', source: S.caffeine },
          { value: '200', label: 'mg a day is the limit during pregnancy.', source: S.caffeine },
        ],
      },
      {
        type: 'list',
        heading: 'Free pre-workout energy',
        items: ['A banana 30–60 minutes before training.', 'A small portion of rice, bread or oats 1–2 hours before.', 'Water. Even mild dehydration makes workouts feel harder.', 'A good night of sleep, which beats any pre-workout.'],
      },
      { type: 'faq', heading: 'Questions', items: [
        { q: 'Should teenagers take supplements?', a: "Under-18s should skip pre-workouts and fat burners and get everything from food. Talk to a doctor before taking anything." },
        { q: 'Does creatine cause hair loss or kidney damage?', a: 'The research reviewed by the ISSN found creatine safe in healthy people at recommended doses. If you have kidney problems, check with your doctor first.' },
      ] },
    ],
    sources: [S.creatine, S.caffeine, S.protein],
  },
];

// Where each home-page card links to.
export const pathLinks = {
  'Home workout': '/paths/home-workout',
  'Gym work': '/paths/gym-work',
  Calisthenics: '/paths/calisthenics',
  'Overall cardio': '/paths/overall-cardio',
};
export const bodyTypeLinks = {
  'V-taper': '/body-types/v-taper',
  'The morphs': '/body-types/the-morphs',
  'Slim cut': '/body-types/slim-cut',
  'Big buff (barbarian)': '/body-types/barbarian',
};
export const offerLinks = {
  Cardio: '/paths/overall-cardio',
  'Muscle building': '/learn/muscle-building',
  'Nutrition & diet': '/learn/nutrition',
  'Supplements & energy': '/learn/supplements',
};

export const pagesByKind = { paths: pathPages, 'body-types': bodyTypePages, learn: learnPages };
