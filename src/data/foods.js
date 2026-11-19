// Everyday foods with a normal portion, for the food tracker. Calories and protein are typical
// estimates for that portion (home cooking varies, especially the oil), not exact values.
// kcal = calories, p = grams of protein.
export const FOOD_CATEGORIES = ['Staples', 'Protein', 'Veg & fruit', 'Breakfast & snacks', 'Drinks', 'Eating out'];

export const foods = {
  // Staples
  ugali: { name: 'Ugali', portion: '1 medium piece (~250 g)', kcal: 300, p: 7, cat: 'Staples' },
  chapati: { name: 'Chapati', portion: '1 chapati', kcal: 250, p: 6, cat: 'Staples' },
  rice: { name: 'Rice (white)', portion: '1 cup cooked', kcal: 205, p: 4, cat: 'Staples' },
  pilau: { name: 'Pilau', portion: '1 cup', kcal: 320, p: 9, cat: 'Staples' },
  githeri: { name: 'Githeri', portion: '1 cup', kcal: 260, p: 11, cat: 'Staples' },
  mukimo: { name: 'Mukimo', portion: '1 cup', kcal: 230, p: 6, cat: 'Staples' },
  matoke: { name: 'Matoke (stewed)', portion: '1 cup', kcal: 200, p: 3, cat: 'Staples' },
  sweetPotato: { name: 'Sweet potato (boiled)', portion: '1 medium', kcal: 130, p: 2, cat: 'Staples' },
  nduma: { name: 'Arrowroot / nduma (boiled)', portion: '1 medium', kcal: 170, p: 2, cat: 'Staples' },
  cassava: { name: 'Cassava (boiled)', portion: '1 cup', kcal: 220, p: 2, cat: 'Staples' },
  potatoes: { name: 'Potatoes (boiled)', portion: '2 medium', kcal: 260, p: 6, cat: 'Staples' },
  spaghetti: { name: 'Spaghetti', portion: '1 cup cooked', kcal: 220, p: 8, cat: 'Staples' },
  bread: { name: 'Bread', portion: '2 slices', kcal: 160, p: 6, cat: 'Staples' },

  // Protein
  eggBoiled: { name: 'Egg (boiled)', portion: '1 egg', kcal: 78, p: 6, cat: 'Protein' },
  eggFried: { name: 'Egg (fried)', portion: '1 egg', kcal: 100, p: 6, cat: 'Protein' },
  chickenStew: { name: 'Chicken stew', portion: '1 portion (~150 g chicken)', kcal: 300, p: 30, cat: 'Protein' },
  chickenFried: { name: 'Fried chicken', portion: '1 quarter', kcal: 400, p: 35, cat: 'Protein' },
  beefStew: { name: 'Beef stew', portion: '1 portion (~150 g beef)', kcal: 330, p: 32, cat: 'Protein' },
  nyamaChoma: { name: 'Nyama choma (goat or beef)', portion: '1/4 kg', kcal: 600, p: 60, cat: 'Protein' },
  omena: { name: 'Omena / dagaa (fried)', portion: '1 cup', kcal: 250, p: 30, cat: 'Protein' },
  tilapia: { name: 'Tilapia (fried)', portion: '1 medium fish', kcal: 400, p: 45, cat: 'Protein' },
  liver: { name: 'Liver (fried)', portion: '1 portion (~150 g)', kcal: 280, p: 35, cat: 'Protein' },
  beans: { name: 'Beans (stew)', portion: '1 cup', kcal: 230, p: 14, cat: 'Protein' },
  ndengu: { name: 'Ndengu / green grams', portion: '1 cup', kcal: 210, p: 14, cat: 'Protein' },
  lentils: { name: 'Lentils / kamande', portion: '1 cup', kcal: 230, p: 18, cat: 'Protein' },
  peanuts: { name: 'Peanuts / njugu', portion: '1 handful (~30 g)', kcal: 170, p: 7, cat: 'Protein' },
  tuna: { name: 'Tuna (tin, drained)', portion: '1 tin', kcal: 130, p: 28, cat: 'Protein' },
  wheyShake: { name: 'Protein shake (whey, with water)', portion: '1 scoop', kcal: 120, p: 24, cat: 'Protein' },

  // Veg & fruit
  sukuma: { name: 'Sukuma wiki', portion: '1 cup cooked', kcal: 80, p: 3, cat: 'Veg & fruit' },
  cabbage: { name: 'Cabbage', portion: '1 cup cooked', kcal: 70, p: 2, cat: 'Veg & fruit' },
  managu: { name: 'Managu / spinach', portion: '1 cup cooked', kcal: 70, p: 4, cat: 'Veg & fruit' },
  kachumbari: { name: 'Kachumbari', portion: '1 cup', kcal: 40, p: 1, cat: 'Veg & fruit' },
  avocado: { name: 'Avocado', portion: '1/2 avocado', kcal: 160, p: 2, cat: 'Veg & fruit' },
  banana: { name: 'Banana', portion: '1 medium', kcal: 105, p: 1, cat: 'Veg & fruit' },
  mango: { name: 'Mango', portion: '1 medium', kcal: 200, p: 3, cat: 'Veg & fruit' },
  orange: { name: 'Orange', portion: '1 orange', kcal: 60, p: 1, cat: 'Veg & fruit' },
  pawpaw: { name: 'Pawpaw', portion: '1 cup', kcal: 60, p: 1, cat: 'Veg & fruit' },
  watermelon: { name: 'Watermelon', portion: '1 slice', kcal: 85, p: 2, cat: 'Veg & fruit' },
  pineapple: { name: 'Pineapple', portion: '1 cup', kcal: 80, p: 1, cat: 'Veg & fruit' },
  apple: { name: 'Apple', portion: '1 apple', kcal: 95, p: 0, cat: 'Veg & fruit' },

  // Breakfast & snacks
  uji: { name: 'Uji (porridge, with sugar)', portion: '1 mug', kcal: 180, p: 4, cat: 'Breakfast & snacks' },
  oats: { name: 'Oats porridge (with milk)', portion: '1 cup', kcal: 250, p: 10, cat: 'Breakfast & snacks' },
  weetabix: { name: 'Weetabix with milk', portion: '2 biscuits', kcal: 250, p: 10, cat: 'Breakfast & snacks' },
  mandazi: { name: 'Mandazi', portion: '1 mandazi', kcal: 200, p: 3, cat: 'Breakfast & snacks' },
  samosa: { name: 'Samosa (beef)', portion: '1 samosa', kcal: 180, p: 6, cat: 'Breakfast & snacks' },
  smokie: { name: 'Smokie', portion: '1 smokie', kcal: 150, p: 6, cat: 'Breakfast & snacks' },
  sausage: { name: 'Sausage', portion: '1 sausage', kcal: 180, p: 7, cat: 'Breakfast & snacks' },
  bhajia: { name: 'Bhajia', portion: '1 plate', kcal: 300, p: 4, cat: 'Breakfast & snacks' },
  biscuits: { name: 'Biscuits', portion: '4 biscuits', kcal: 200, p: 3, cat: 'Breakfast & snacks' },
  chocolate: { name: 'Chocolate bar', portion: '1 small bar', kcal: 230, p: 3, cat: 'Breakfast & snacks' },
  popcorn: { name: 'Popcorn', portion: '1 bowl', kcal: 150, p: 4, cat: 'Breakfast & snacks' },

  // Drinks
  milk: { name: 'Milk (whole)', portion: '1 glass (250 ml)', kcal: 150, p: 8, cat: 'Drinks' },
  mala: { name: 'Mala / yoghurt', portion: '1 glass (250 ml)', kcal: 160, p: 8, cat: 'Drinks' },
  chai: { name: 'Chai (milk + sugar)', portion: '1 cup', kcal: 90, p: 2, cat: 'Drinks' },
  chaiNoSugar: { name: 'Chai (no sugar)', portion: '1 cup', kcal: 40, p: 2, cat: 'Drinks' },
  coffeeBlack: { name: 'Black coffee or tea', portion: '1 cup', kcal: 5, p: 0, cat: 'Drinks' },
  juice: { name: 'Fruit juice', portion: '1 glass (250 ml)', kcal: 120, p: 1, cat: 'Drinks' },
  soda: { name: 'Soda', portion: '1 bottle (500 ml)', kcal: 210, p: 0, cat: 'Drinks' },
  beer: { name: 'Beer', portion: '1 bottle (500 ml)', kcal: 220, p: 2, cat: 'Drinks' },

  // Eating out
  rolex: { name: 'Rolex (chapati + eggs)', portion: '1 rolex', kcal: 450, p: 16, cat: 'Eating out' },
  chipsPlate: { name: 'Chips / fries', portion: '1 portion', kcal: 450, p: 5, cat: 'Eating out' },
  mutura: { name: 'Mutura', portion: '1 portion', kcal: 300, p: 15, cat: 'Eating out' },
  burger: { name: 'Burger', portion: '1 burger', kcal: 500, p: 25, cat: 'Eating out' },
  pizza: { name: 'Pizza', portion: '1 slice', kcal: 285, p: 12, cat: 'Eating out' },
};

export const PORTIONS = [0.5, 1, 1.5, 2, 3];
