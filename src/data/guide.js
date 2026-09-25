// All of the site's written content lives here.
// To change what the site says, edit this file — the components just render it.

export const intro = {
  eyebrow: 'Gymnazzium · Your fitness guide',
  lead:
    "Most people want to get fit but don't know how to start. This guide will help you get into shape and clarify what you want.",
  pillars: ['Discipline', 'Consistency', 'Commitment'],
};

export const paths = [
  { title: 'Home workout', text: 'No equipment, no membership. Start where you are with bodyweight basics.' },
  { title: 'Gym work', text: 'Building muscle in general, using weights and machines.' },
  { title: 'Calisthenics', text: 'Managing and balancing your own body weight, all the way up to really hard tricks.' },
  { title: 'Overall cardio', text: 'Intensive activities that burn fat.' },
];

export const bodyTypes = [
  { title: 'V-taper', text: 'Broad shoulders and back narrowing down to a tight waist.' },
  { title: 'The morphs', text: 'Built around your natural body type and how it responds to training.' },
  { title: 'Slim cut', text: 'Lean and defined, with low body fat and visible muscle.' },
  { title: 'Big buff (barbarian)', text: 'Maximum size and mass across the whole body.' },
];

export const offers = [
  {
    title: 'Cardio',
    text: 'Activities that burn fat: running, burpees, swimming, jump rope and jogging. In short, anything with a lot of sweating and a raised heart rate.',
  },
  {
    title: 'Muscle building',
    text: 'The body has different muscles that can each be trained for definition: forearms, upper arms, shoulders, chest, back, thighs/quads, calves, abs, obliques, neck and more.',
  },
  {
    title: 'Nutrition & diet',
    text: 'Crucial to everything else. Cut excess carbs to lose fat; eat plenty of protein to build muscle.',
  },
  {
    title: 'Supplements & energy',
    text: 'What to take (and eat) before a workout to make your sessions more productive.',
  },
];

// Options for the registration form.
export const registration = {
  goals: ['Lose fat', 'Build muscle', 'Get toned / defined', 'Improve stamina', 'Get stronger', 'General health'],
  lookingFor: ['Home workout', 'Gym work', 'Calisthenics', 'Overall cardio'],
  timelines: ['1 month', '3 months', '6 months', '1 year+'],
  schedules: ['2 days a week', '3 days a week', '4 days a week', '5+ days a week'],
};

// The training guide. Each entry becomes a tab.
// groups → sub-headings, exercises → items, instructions → the "how to progress" box.
export const guide = [
  {
    id: 'basics',
    label: 'Basics & Cardio',
    title: 'Start with the basics',
    intro: [
      "If having access to a gym is not possible, start with the simplest but still effective exercises. I didn't have access to a gym either, so this is where I started.",
      'Cardio and strength training together will help you lose fat, build muscle, and stay shredded with mass all year round.',
      'Cardio involves a lot of movement that leads to sweating, which burns fat.',
    ],
    groups: [
      {
        name: 'Cardio',
        exercises: [
          {
            name: 'Running or jogging',
            text: 'Good cardio that helps blood circulation, which helps prevent diseases like high blood pressure, heart problems and cholesterol issues, since it burns excess fat.',
            dose: 'Add full sprints to your jog, resting at least 45 seconds between them, at least 5 times. Boosts stamina and lung capacity.',
          },
          {
            name: 'Jump rope',
            text: "An effective way to burn fat. If you're not into running, this is the best solution for you. It also develops your calves, quads and overall leg power.",
          },
        ],
      },
    ],
    steps: {
      title: 'Jump rope form',
      items: [
        'Rope length: step on the middle of the rope — the ends should reach your chest.',
        'Keep your knees slightly bent when jumping.',
        "Don't land flat-footed or on your toes; land on the balls of your feet.",
        'Keep your legs slightly apart.',
        "Don't swing your arms — rotate from the wrists.",
        'Keep your elbows close to your body; don’t flare them out.',
      ],
      note: "It's hard to focus on everything at once, so work on one point at a time.",
    },
  },
  {
    id: 'chest',
    label: 'Chest',
    title: 'Overall chest development',
    intro: [
      'The chest has three main parts: the upper chest, mid chest and lower chest.',
      'Push-ups genuinely help the growth of the whole chest, and different variations target different parts of it.',
    ],
    groups: [
      {
        name: 'Push-up variations',
        exercises: [
          { name: 'Wide push-ups', text: 'Mostly the lower chest, plus the front shoulders (front delts).' },
          { name: 'Narrow push-ups', text: 'Targets the mid chest and part of the triceps.' },
          { name: 'Diamond push-ups', text: 'Targets the upper chest, forearms and triceps, with a little impact on the back and lats.' },
          {
            name: 'Pike push-ups',
            text: 'Targets the shoulders. Form an inverted "V" with your legs and hands, then push up.',
            dose: 'Advanced: put your feet on a raised platform so your upper body is more vertical. Harder, but more gains — and it can lead to handstands.',
          },
          {
            name: 'Mike Tyson push-ups',
            text: 'A squat and a push-up in every rep. Doubles as cardio.',
          },
          { name: 'Decline push-ups', text: 'Feet on a raised platform, which puts more of your body weight on the push-up.' },
          { name: 'Incline push-ups', text: 'Hands on a raised platform. Best for beginners who find normal push-ups difficult.' },
        ],
      },
      {
        name: 'More variations',
        tags: [
          'Spider',
          'Pseudo — triceps',
          'Tiger — fingers & forearms',
          'Russian',
          'Hinge',
          'Clap — explosiveness',
          'Shift',
          'Archer',
          'Hindu',
          'Reverse — upper chest',
        ],
      },
    ],
    tip: "My recommendation: normal, wide, diamond and pike. Those got me where I am. Don't worry about all the other flashy moves.",
    instructions: [
      'First, do max reps until failure. That is your starting point.',
      'If your max is 10, do sets of 5 or fewer reps until failure.',
      'Keep this up for 3 weeks, then gradually increase your reps as you grow.',
      "It won't be easy. The first days will feel like hell and you may want to give up — work through it.",
    ],
  },
  {
    id: 'abs',
    label: 'Abs',
    title: 'Abs / six-pack',
    intro: [
      "This is what most of you are excited about. It isn't easy — it takes discipline and commitment, and most people give up before they see results. I'll help you walk through this journey.",
      'The abdomen has four sets of muscles: the upper abs (top two sets), the lower abs (bottom two sets), and the obliques.',
    ],
    groups: [
      {
        name: 'Upper abs',
        note: "Usually the easiest set to get. This won't take as long as you think.",
        exercises: [
          {
            name: 'Crunches / sit-ups',
            text: "Lie flat on a mat on the floor (not the bed — it won't be effective). Bend your knees, put your hands at your temples, then lift your upper body up and down. If your legs shift around, have someone hold them.",
            dose: 'Beginners: 3 sets of 20 reps, then increase reps and sets as you progress.',
          },
        ],
      },
      {
        name: 'Lower abs',
        note: 'A little harder and usually takes longer, but very achievable.',
        exercises: [
          { name: 'Leg raises', text: 'Lie flat facing up and raise both legs.', dose: '3 sets of 5 reps to start.' },
          { name: 'Mountain climbers', text: 'Hands on a raised platform or in a push-up position; drive your knees to your chest and back.', dose: '3 sets of 20 reps.' },
          { name: 'Crucifix / starfish hold', text: 'Lie flat facing up and raise your legs and arms. Hold.', dose: '3 sets, hold at least 20 seconds.' },
          { name: 'Plank', text: 'Like a push-up position, but resting on your forearms.', dose: 'Hold 45 seconds to a minute.' },
          { name: 'Reverse mountain climbers', text: 'Lie facing up, raise your upper body and hands slightly, and bring your knees to your chest one at a time.', dose: '3 sets of 20 reps.' },
          { name: 'Knee tucks', text: "Upper body slightly raised, bring both knees to your chest. Don't let your feet touch the ground — that makes it more effective.", dose: '3 sets of 15–20 reps.' },
        ],
      },
      {
        name: 'Obliques',
        note: 'Side-to-side movement of the abdomen.',
        exercises: [
          { name: 'Side-to-side touches', text: 'From a crunch position, reach side to side (or touch a wall on each side). This expands and contracts the obliques.', dose: '3 sets of 20 reps.' },
          { name: 'Side plank', text: 'A plank on one arm, facing sideways. A bit technical.', dose: '3 holds of 30–45 seconds.' },
        ],
      },
      {
        name: 'V-line',
        note: 'The V-line comes from the lower abs. Doing the lower-ab exercises above will make it more pronounced.',
      },
    ],
    tip: 'Diet matters most here. Fat collects on the belly first and hides definition. Cut carbs and sugar (natural sugar from fruit like bananas is fine), prioritise protein, and do cardio daily to burn lower-belly fat. With a good diet and proper cardio, you will see big changes in a few months.',
    instructions: [
      "Don't overdo it — it can cause severe abdominal pain.",
      'Take it slow and increase your sets or reps every 3 weeks.',
    ],
  },
  {
    id: 'shoulders',
    label: 'Shoulders',
    title: 'Shoulders',
    intro: ['The shoulder has three heads: the front deltoids, side deltoids and rear deltoids.'],
    groups: [
      {
        name: 'Front delts',
        exercises: [
          { name: 'Pike push-ups', text: 'Push-ups from an inverted "V". If that feels easy, put your feet on a raised platform (elevated pike).' },
          { name: 'Front raises', text: 'With a dumbbell or barbell, raise your arms in front of you to eye level.' },
        ],
      },
      {
        name: 'Side delts',
        note: 'What makes the shoulder bulge out from the side.',
        exercises: [
          { name: 'Lateral raises', text: 'With dumbbells, gently raise your arms out to the sides, away from your hips.' },
          { name: 'Shoulder press', text: "With dumbbells or a barbell (preferably seated), press straight up above your head and back down. Don't go too heavy — it can cause back pain. Use a load within your capacity." },
        ],
      },
      {
        name: 'Rear delts',
        note: 'The back of the shoulder, which also ties into the upper back.',
        exercises: [
          { name: 'Rear delt fly', text: "Bend forward slightly (preferably seated) and raise the dumbbells out and back — like flapping your wings." },
          { name: 'Band reverse fly', text: 'No weights: step on a resistance band, cross the ends, then fly.' },
          { name: 'Dumbbell bent-over row', text: 'Left hand on a raised platform; pull the dumbbell with your right arm until your elbow is above your back and you feel it in the right rear delt.' },
          { name: 'Barbell bent-over row', text: 'Bend slightly and pull the barbell to your chest, with your arms at 45°–90° from your body.' },
        ],
      },
    ],
    instructions: [
      'Pick a weight you can do for 8–12 reps per set, for at least 3 sets.',
      'If you are beating that rep range within 3 weeks, increase the weight.',
    ],
  },
  {
    id: 'forearms',
    label: 'Forearms',
    title: 'Forearms',
    intro: [
      'The forearm has two main compartments: the flexors on the inner side, which bend the wrist and fingers, and the extensors on the outer side, which straighten them.',
      "Most forearm work uses equipment, but don't worry — you can improvise.",
    ],
    groups: [
      {
        name: 'Improvised (no gym)',
        exercises: [
          { name: "Farmer's carry", text: 'Carry two water jerricans, buckets of water, or anything that makes you grip hard.' },
          { name: 'Brick / book pinch', text: 'Pinch a brick or a dictionary and do wrist curls with it.' },
          { name: 'Finger push-ups', text: 'Strengthens the forearm muscles.' },
        ],
      },
      {
        name: 'With equipment',
        exercises: [
          { name: 'Wrist curls', text: 'Rest your forearms on a bench, palms up, with your wrists hanging off the edge. Curl the weight up. Works the inner forearm (flexors).' },
          { name: 'Reverse wrist curls', text: 'Same setup with palms facing down. Works the outer forearm (extensors).' },
          { name: 'Plate pinch', text: 'Pinch heavy plates and hold them — walk around if you like. Builds grip and overall forearm strength.' },
        ],
        tags: ["Farmer's carry", 'Hammer curls', 'Bicep curls', 'Pull-ups', 'Dead hangs'],
      },
    ],
    instructions: [
      "Forearms aren't that technical.",
      'Find a weight that suits you and do 3 sets to complete burnout (until failure).',
    ],
  },
  {
    id: 'arms',
    label: 'Upper arms',
    title: 'Upper arms',
    intro: [
      "I know y'all want big biceps — but don't neglect the triceps. They make up about two-thirds of your upper arm.",
    ],
    groups: [
      {
        name: 'Biceps',
        note: 'Three muscles to train: the biceps brachii (long and short head), the brachialis (sits underneath and widens the arm so it doesn’t look thin from the front), and the brachioradialis. Here it’s all about curls.',
        exercises: [
          { name: 'Hammer curls', text: 'Neutral grip. Widens the brachialis.' },
          { name: 'Concentration curls', text: 'Sit on a bench with legs apart, rest your elbow against your inner thigh and curl the dumbbell.' },
        ],
        tags: ['Spider curls', 'Preacher hammer curls', 'Preacher curls', 'Bicep curls', 'Barbell curls'],
      },
      {
        name: 'Triceps',
        note: 'This is where size really matters, and it’s an easy muscle to grow because so many movements (like push-ups) use it. It has three heads, all on the back of the arm: the long head, the lateral head, and the medial head underneath them. Training the long and lateral heads thickens and widens the arm.',
      },
    ],
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    title: 'Nutrition & supplements',
    intro: ['Nutrition is crucial. What you eat decides whether your training shows.'],
    groups: [
      {
        name: 'To lose fat',
        note: 'Avoid too many carbs. Cut back on foods like wheat, rice and oily foods. Excess fat collects over the muscle and under the skin, hiding veins and definition.',
      },
      {
        name: 'To build muscle',
        note: 'Eat foods high in protein.',
        exercises: [
          { name: 'Animal protein', text: 'Beef, chicken, fish, eggs, mutton, lamb and more.' },
          { name: 'Plant protein', text: 'Beans, peas, green grams, nuts and more.' },
        ],
      },
      {
        name: 'Supplements',
        note: 'Creatine is the most common supplement, and studies show it helps muscle growth. Talk to a doctor or pharmacist before starting any supplement.',
      },
      {
        name: 'Pre-workout energy',
        note: 'Eat light, fast-digesting carbs before training — bananas are a really good source of energy, and a little rice works too. Carbs before a workout help boost performance.',
      },
    ],
  },
];

export const calorieDeficit = {
  text: [
    'A calorie deficit happens when you eat fewer calories than your body uses for fuel, so it taps into stored body fat.',
    "Eat low-calorie foods that still nourish you. Don't starve yourself — that can lead to regaining the fat you lost.",
    'Track your daily activity, hydration, sleep and food choices, and be patient.',
  ],
  // Example: walking 6,000 steps burns roughly 180–300 kcal.
  burn: { label: 'Walking 6,000 steps', min: 180, max: 300 },
  foods: [
    { name: 'Fries (100 g)', kcal: 305, note: '290–320 kcal' },
    { name: 'Mashed potatoes (100 g)', kcal: 88, note: '88 kcal' },
  ],
  takeaway:
    'Eat fries and the walk only burns off what you just ate. Eat mashed potatoes and the same walk burns the 88 kcal plus another 92–212 kcal from your fat reserves.',
};
