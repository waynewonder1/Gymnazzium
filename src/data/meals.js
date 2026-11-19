// Post-workout meal ideas ("Refuel"), built from data/foods.js so calories add up from the same
// numbers the tracker uses. goal: which food goal the meal suits; when: time of day.
export const FOOD_GOALS = {
  gain: { label: 'Gain weight / bulk', icon: '🍗', adjust: 300, text: 'About 300 kcal a day above maintenance, so most of what you gain is muscle.' },
  maintain: { label: 'Maintain my weight', icon: '⚖️', adjust: 0, text: 'Eat about what you burn. Good for getting stronger without changing weight.' },
  lose: { label: 'Lose weight', icon: '🔥', adjust: -500, text: 'About 500 kcal a day below maintenance: roughly 0.5 kg a week, without starving.' },
};

export const meals = [
  // Gain
  { name: 'Ugali, beef stew & sukuma', goal: 'gain', when: ['afternoon', 'evening'], items: [['ugali', 1.5], ['beefStew', 1], ['sukuma', 1]] },
  { name: 'Rice, beans, 2 eggs & avocado', goal: 'gain', when: ['afternoon', 'evening'], items: [['rice', 2], ['beans', 1], ['eggFried', 2], ['avocado', 1]] },
  { name: '2 chapati, ndengu & a glass of milk', goal: 'gain', when: ['afternoon', 'evening'], items: [['chapati', 2], ['ndengu', 1], ['milk', 1]] },
  { name: 'Pilau, kachumbari & a banana', goal: 'gain', when: ['afternoon', 'evening'], items: [['pilau', 2], ['kachumbari', 1], ['banana', 1]] },
  { name: 'Oats with milk, banana & peanuts', goal: 'gain', when: ['morning'], items: [['oats', 1.5], ['banana', 1], ['peanuts', 1]] },
  { name: 'Rolex & mala', goal: 'gain', when: ['morning', 'afternoon'], items: [['rolex', 1], ['mala', 1]] },
  { name: '3 eggs, 2 slices of bread & milk', goal: 'gain', when: ['morning'], items: [['eggFried', 3], ['bread', 1], ['milk', 1]] },

  // Maintain
  { name: 'Ugali, sukuma & 2 eggs', goal: 'maintain', when: ['afternoon', 'evening'], items: [['ugali', 1], ['sukuma', 1], ['eggFried', 2]] },
  { name: 'Githeri & avocado', goal: 'maintain', when: ['afternoon', 'evening'], items: [['githeri', 1.5], ['avocado', 1]] },
  { name: 'Rice, chicken stew & cabbage', goal: 'maintain', when: ['afternoon', 'evening'], items: [['rice', 1], ['chickenStew', 1], ['cabbage', 1]] },
  { name: 'Chapati & beans', goal: 'maintain', when: ['afternoon', 'evening'], items: [['chapati', 1], ['beans', 1], ['kachumbari', 1]] },
  { name: 'Oats with milk & a banana', goal: 'maintain', when: ['morning'], items: [['oats', 1], ['banana', 1]] },
  { name: '2 boiled eggs, bread & chai', goal: 'maintain', when: ['morning'], items: [['eggBoiled', 2], ['bread', 1], ['chai', 1]] },

  // Lose
  { name: 'Chicken stew, cabbage & a small sweet potato', goal: 'lose', when: ['afternoon', 'evening'], items: [['chickenStew', 1], ['cabbage', 1], ['sweetPotato', 1]] },
  { name: '2 boiled eggs, sukuma & half an ugali', goal: 'lose', when: ['afternoon', 'evening'], items: [['eggBoiled', 2], ['sukuma', 1], ['ugali', 0.5]] },
  { name: 'Ndengu & managu', goal: 'lose', when: ['afternoon', 'evening'], items: [['ndengu', 1], ['managu', 1]] },
  { name: 'Tilapia, kachumbari & half an ugali', goal: 'lose', when: ['afternoon', 'evening'], items: [['tilapia', 1], ['kachumbari', 1], ['ugali', 0.5]] },
  { name: 'Omena, sukuma & half an ugali', goal: 'lose', when: ['afternoon', 'evening'], items: [['omena', 1], ['sukuma', 1], ['ugali', 0.5]] },
  { name: 'Mala & a banana', goal: 'lose', when: ['morning', 'afternoon'], items: [['mala', 1], ['banana', 1]] },
  { name: '2 boiled eggs & chai without sugar', goal: 'lose', when: ['morning'], items: [['eggBoiled', 2], ['chaiNoSugar', 1]] },
  { name: 'Protein shake & an orange', goal: 'lose', when: ['morning', 'afternoon', 'evening'], items: [['wheyShake', 1], ['orange', 1]] },
];
