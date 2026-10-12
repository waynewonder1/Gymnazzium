// Coaching content for personal plans: goal deep-dives, daily missions,
// predictable obstacles, and strategies for each challenge a member picks.

// topics → which tabs of the training guide (data/guide.js) to show for this goal.
export const goalDetails = {
  'Lose fat': {
    headline: 'Burn more than you eat, and keep your muscle while you do it.',
    points: [
      'Fat loss comes from a calorie deficit: eating fewer calories than your body uses, so it has to draw from stored fat.',
      'Cardio raises how much you burn. Strength training keeps your muscle so the weight you lose is fat, not muscle.',
      'Cut back on refined carbs and oily food (fries, white bread, sugary drinks). Fat collects on the belly and under the skin first, and that hides definition.',
      "Don't starve yourself. Crash diets usually end with the fat coming back.",
    ],
    topics: ['basics', 'nutrition'],
    showDeficit: true,
  },
  'Build muscle': {
    headline: 'Train hard, eat enough protein, and add a little every 3 weeks.',
    points: [
      'Muscle grows when you make it do a bit more than last time (more reps, more weight or a harder variation). Your plan steps up every 3 weeks.',
      'Protein is the raw material. Aim for the daily target below, spread across your meals.',
      'You need a small calorie surplus. Eating too little stalls growth.',
      'Muscle grows while you rest, not while you train. Sleep 8 hours, drink 2–3 L of water, and keep your rest days.',
    ],
    topics: ['chest', 'shoulders', 'arms', 'forearms', 'nutrition'],
  },
  'Get toned / defined': {
    headline: 'Definition = muscle you can see. Build it, then uncover it.',
    points: [
      '"Toned" means two things together: enough muscle, and low enough body fat to see it.',
      'Your plan mixes strength days (to build) with core work, and runs a mild calorie deficit (to uncover).',
      'Abs are mostly revealed in the kitchen. You can have strong abs that stay hidden under belly fat.',
      'Lower abs and the V-line take the longest. Be patient with them.',
    ],
    topics: ['abs', 'chest', 'nutrition'],
    showDeficit: true,
  },
  'Improve stamina': {
    headline: 'Train your heart and lungs to go longer before they tire.',
    points: [
      'Steady jogs build your base. Sprints and jump rope push your limit.',
      'Increase slowly. Running too much too soon is how shin and knee pain starts.',
      "You'll notice it on stairs and in daily life within a few weeks.",
    ],
    topics: ['basics'],
  },
  'Get stronger': {
    headline: 'Strength is a skill. Practice heavy, clean reps.',
    points: [
      'Pick weights you can move for 8–12 good reps. When you beat that for 3 weeks, go heavier.',
      'For bodyweight work, once a move gets easy, switch to a harder variation instead of doing endless reps.',
      'Grip strength carries over to everything, so the forearm work matters.',
    ],
    topics: ['chest', 'shoulders', 'forearms'],
  },
  'Run 1–10 km': {
    headline: 'Run your distance, built up a little every 3 weeks.',
    points: [
      'Beginners: run 1–3 km and take walk breaks whenever you need them. Finishing the distance is the win.',
      'Intermediate: run 5 km with one short break at most, or the whole thing.',
      'Experienced: run 10 km without stopping.',
      'Your runs sit on your rest days and get longer every 3 weeks. Running too far too soon is how shin and knee pain starts, so stick to the plan even on good days.',
      'Run at a pace where you could still say a few words. Speed comes later; distance first.',
    ],
    topics: ['basics'],
  },
  'General health': {
    headline: 'Move most days, eat real food, sleep well.',
    points: [
      'Regular cardio helps your blood pressure, heart and cholesterol.',
      'Strength training keeps your joints and bones strong as you age.',
      'Consistency beats intensity. Three average sessions every week beat one perfect week a month.',
    ],
    topics: ['basics', 'nutrition'],
  },
};

// Daily missions. `for` lists the goals a mission applies to (omit = everyone).
// {water} and {protein} are filled in from the member's numbers.
export const missions = [
  { text: 'Drink at least {water} L of water today.' },
  { text: 'Sleep 8 hours tonight. Recovery is where progress happens.' },
  { text: 'Tell one person about your goal. It makes quitting harder.' },
  { text: '10 minutes of stretching before bed.' },
  { text: 'Hit 6,000 steps today.', for: ['Lose fat', 'Improve stamina', 'General health', 'Get toned / defined'] },
  { text: 'Swap one fried food for a boiled or mashed one.', for: ['Lose fat', 'Get toned / defined'] },
  { text: 'No sugary drinks today. Fruit is fine.', for: ['Lose fat', 'Get toned / defined', 'General health'] },
  { text: 'Write down everything you eat today. No judging, just noticing.', for: ['Lose fat', 'Get toned / defined'] },
  { text: 'Cook at home today instead of buying fast food.', for: ['Lose fat', 'General health'] },
  { text: 'Hit {protein} g of protein: eggs, beans, green grams, chicken or fish.', for: ['Build muscle', 'Get stronger', 'Get toned / defined'] },
  { text: 'Protein at every meal today.', for: ['Build muscle', 'Get stronger'] },
  { text: 'Eat a banana 30–60 minutes before your next workout.', for: ['Build muscle', 'Get stronger', 'Improve stamina'] },
];

export const weeklyMission = 'Take progress photos (front, side, back) in the same spot and light as last week.';

// Predictable obstacles along the way, by day number (0 = first day).
export const milestones = [
  { day: 0, title: 'Day one', text: "Test your max on your first set of each exercise: that number is your starting point. Don't compare it with anyone else's." },
  { day: 1, title: 'Soreness is coming', text: "Expect sore muscles for 1–3 days. It's normal. Walk, stretch and drink water, but don't skip your next session." },
  { day: 6, title: 'One week down', text: "Most people never finish week one. You did. Look back at day one: the first days really were the hardest." },
  { day: 13, title: 'The two-week slump', text: 'The excitement wears off around now, and this is when most people quit. Do the session anyway. Even a short version counts.' },
  { day: 20, levelUp: true, title: 'Level up tomorrow', text: "Three weeks in, so your reps go up from tomorrow. If last week's sets felt easy, you earned it." },
  { day: 41, title: 'Life gets busy', text: 'Around week 6, work, school or family start competing for your time. Keep a 15-minute backup: the full-body circuit, anywhere.' },
  { day: 55, title: 'Results feel slow', text: "You see yourself every day, so change is hard to notice. Compare today's photo with day one's, not the mirror." },
  { day: 83, title: 'Three months', text: "You've built a habit. Look at your streak and your numbers, then set the next target." },
  { day: 181, title: 'Six months', text: 'Half a year of showing up. Your body is different now, and so is your discipline.' },
];

// Challenges members can pick at registration, with a strategy for each.
export const challenges = {
  'No gym access': 'Every session in your plan works at home. Improvise: water jerricans for carries, a dictionary for pinches, a sturdy table for rows.',
  'Not enough time': 'Your sessions take about 30 minutes. On a packed day, do only the full-body circuit (15 minutes) and count it. Book the time like a meeting.',
  'Staying consistent': "Never miss twice. One missed day is life; two is the start of a new habit. Keep your reminders on and protect your streak.",
  'Low motivation': "Don't wait to feel like it. Commit to the 5-minute warm-up only. Once you've started, you'll usually finish.",
  'Injury or pain': "Soreness is fine; sharp or joint pain is not. Stop, and see a doctor or physio before training through an injury. Use the easier variation of any move that hurts.",
  'Eating habits': "Don't overhaul everything at once. Change one meal at a time; your daily missions do this for you.",
  'Tight budget': 'Cheap protein: eggs, beans, green grams, omena. Cheapest useful equipment: a jump rope. Everything else can be improvised.',
  "Don't know proper form": 'Each exercise in your plan comes with a form cue. Go slow, film yourself from the side, and compare. Clean reps beat more reps.',
};
