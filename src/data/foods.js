// Everyday foods for the food tracker, per 100 g as eaten (per 100 ml for drinks), with real
// portion sizes in grams. The first portion is the usual one.
//
// per100 = [kcal, protein g, carbs g, fat g]. Cooked dishes include typical home-cooking oil.
// These are estimates in line with standard food tables; every value is still to be checked
// against the Kenya Food Composition Tables 2018 (KFCT, Ministry of Health / FAO) before launch.
// `checked: true` marks a food once someone has done that. Home cooking varies, especially oil.
export const FOOD_CATEGORIES = ['Staples', 'Protein', 'Veg & fruit', 'Breakfast & snacks', 'Drinks', 'Eating out'];
export const FOOD_SOURCE = 'Kenya Food Composition Tables 2018 (to be checked)';

const food = (name, cat, [kcal, p, c, f], portions, extra = {}) => ({
  name,
  cat,
  per100: { kcal, p, c, f },
  portions: portions.map(([label, g]) => ({ label, g })),
  unit: cat === 'Drinks' ? 'ml' : 'g',
  ...extra,
});

export const foods = {
  // Staples
  ugali: food('Ugali', 'Staples', [120, 2.6, 26, 0.5], [['1 medium piece', 250], ['1 small piece', 150], ['1 large piece', 400]]),
  ugaliBrown: food('Ugali (wimbi / millet mix)', 'Staples', [125, 3, 26, 1], [['1 medium piece', 250], ['1 small piece', 150], ['1 large piece', 400]]),
  chapati: food('Chapati', 'Staples', [300, 7.5, 46, 10], [['1 chapati', 80], ['1 big chapati', 120]]),
  rice: food('Rice (white)', 'Staples', [130, 2.7, 28, 0.3], [['1 cup cooked', 160], ['1 small plate', 250], ['1 full plate', 350]]),
  pilau: food('Pilau', 'Staples', [180, 5, 25, 6.5], [['1 cup', 180], ['1 full plate', 350]]),
  githeri: food('Githeri', 'Staples', [140, 6, 22, 3], [['1 cup', 190], ['1 full plate', 350]]),
  mukimo: food('Mukimo', 'Staples', [110, 3, 19, 2.5], [['1 cup', 210], ['1 full plate', 350]]),
  matoke: food('Matoke (stewed)', 'Staples', [100, 1.3, 20, 2], [['1 cup', 200], ['1 full plate', 350]]),
  sweetPotato: food('Sweet potato (boiled)', 'Staples', [76, 1.4, 17.7, 0.1], [['1 medium', 170], ['1 large', 280]]),
  nduma: food('Arrowroot / nduma (boiled)', 'Staples', [120, 1.5, 28, 0.2], [['1 medium', 150], ['1 large', 250]]),
  cassava: food('Cassava (boiled)', 'Staples', [130, 1.2, 31, 0.3], [['1 cup', 170], ['1 large piece', 250]]),
  potatoes: food('Potatoes (boiled)', 'Staples', [87, 1.9, 20, 0.1], [['2 medium', 300], ['1 medium', 150]]),
  spaghetti: food('Spaghetti', 'Staples', [158, 5.8, 31, 0.9], [['1 cup cooked', 140], ['1 full plate', 300]]),
  bread: food('Bread (white)', 'Staples', [265, 9, 49, 3.2], [['2 slices', 60], ['1 slice', 30]]),

  // Protein
  eggBoiled: food('Egg (boiled)', 'Protein', [155, 12.6, 1.1, 10.6], [['1 egg', 50]]),
  eggFried: food('Egg (fried)', 'Protein', [196, 13.6, 0.8, 15], [['1 egg', 50]]),
  chickenStew: food('Chicken stew', 'Protein', [136, 13.6, 3, 7.5], [['1 portion (with sauce)', 220], ['1 big portion', 330]]),
  chickenBreast: food('Chicken breast (grilled)', 'Protein', [165, 31, 0, 3.6], [['1 portion', 150], ['1 small portion', 100]]),
  chickenFried: food('Fried chicken', 'Protein', [250, 22, 5, 15.5], [['1 quarter', 160], ['1 piece', 90]]),
  beefStew: food('Beef stew', 'Protein', [150, 14.5, 3, 8.8], [['1 portion (with sauce)', 220], ['1 big portion', 330]]),
  matumbo: food('Matumbo (tripe stew)', 'Protein', [110, 12, 3, 5.5], [['1 portion', 200]]),
  nyamaChoma: food('Nyama choma (goat or beef)', 'Protein', [240, 24, 0, 16], [['1/4 kg', 250], ['1/2 kg', 500]]),
  omena: food('Omena / dagaa (fried)', 'Protein', [250, 30, 2, 13.5], [['1 cup', 100], ['1 small portion', 60]]),
  tilapia: food('Tilapia (fried)', 'Protein', [200, 22.5, 3, 11], [['1 medium fish', 200], ['1 large fish', 300]]),
  fishStew: food('Fish wet fry (stew)', 'Protein', [140, 16, 4, 6.5], [['1 fish with sauce', 250]]),
  liver: food('Liver (fried)', 'Protein', [187, 23.5, 4, 8.5], [['1 portion', 150]]),
  beans: food('Beans (stew)', 'Protein', [115, 7, 16, 2.5], [['1 cup', 200], ['1 full plate', 300]]),
  ndengu: food('Ndengu / green grams', 'Protein', [105, 7, 15, 2], [['1 cup', 200], ['1 full plate', 300]]),
  lentils: food('Lentils / kamande', 'Protein', [115, 9, 16, 1.6], [['1 cup', 200], ['1 full plate', 300]]),
  peanuts: food('Peanuts / njugu', 'Protein', [585, 24, 16, 49], [['1 handful', 30], ['1 small packet', 50]]),
  tuna: food('Tuna (tin, drained)', 'Protein', [116, 26, 0, 1], [['1 tin', 120]]),
  wheyShake: food('Protein shake (whey, with water)', 'Protein', [400, 80, 8, 6], [['1 scoop of powder', 30]]),

  // Veg & fruit
  sukuma: food('Sukuma wiki', 'Veg & fruit', [55, 2.5, 5, 3], [['1 cup cooked', 150]]),
  cabbage: food('Cabbage', 'Veg & fruit', [50, 1.3, 6, 2.5], [['1 cup cooked', 150]]),
  managu: food('Managu / spinach', 'Veg & fruit', [50, 3, 4, 2.5], [['1 cup cooked', 150]]),
  kachumbari: food('Kachumbari', 'Veg & fruit', [25, 0.8, 5, 0.2], [['1 cup', 160]]),
  avocado: food('Avocado', 'Veg & fruit', [160, 2, 3, 14.7], [['1/2 avocado', 100], ['1 whole avocado', 200]]),
  banana: food('Banana', 'Veg & fruit', [89, 1.1, 22.8, 0.3], [['1 medium', 118], ['1 small (ndizi kidole)', 60]]),
  mango: food('Mango', 'Veg & fruit', [60, 0.8, 15, 0.4], [['1 medium', 300], ['1 small', 180]]),
  orange: food('Orange', 'Veg & fruit', [47, 0.9, 11.8, 0.1], [['1 orange', 130]]),
  pawpaw: food('Pawpaw', 'Veg & fruit', [43, 0.5, 10.8, 0.3], [['1 cup', 145]]),
  watermelon: food('Watermelon', 'Veg & fruit', [30, 0.6, 7.6, 0.2], [['1 slice', 280]]),
  pineapple: food('Pineapple', 'Veg & fruit', [50, 0.5, 13, 0.1], [['1 cup', 165]]),
  apple: food('Apple', 'Veg & fruit', [52, 0.3, 13.8, 0.2], [['1 apple', 180]]),

  // Breakfast & snacks
  uji: food('Uji (porridge, with sugar)', 'Breakfast & snacks', [60, 1.2, 13, 0.4], [['1 mug', 300]]),
  oats: food('Oats porridge (with milk)', 'Breakfast & snacks', [100, 4, 13.5, 3.3], [['1 cup', 250]]),
  weetabix: food('Weetabix with milk', 'Breakfast & snacks', [132, 5.3, 17, 4.2], [['2 biscuits + milk', 190]]),
  mandazi: food('Mandazi', 'Breakfast & snacks', [380, 6.5, 48, 18], [['1 mandazi', 55]]),
  samosa: food('Samosa (beef)', 'Breakfast & snacks', [290, 9.5, 25, 17], [['1 samosa', 60]]),
  smokie: food('Smokie', 'Breakfast & snacks', [260, 11, 4, 22], [['1 smokie', 55]]),
  sausage: food('Sausage', 'Breakfast & snacks', [280, 11, 6, 23.5], [['1 sausage', 65]]),
  bhajia: food('Bhajia', 'Breakfast & snacks', [260, 3, 30, 14.5], [['1 plate', 120]]),
  biscuits: food('Biscuits', 'Breakfast & snacks', [480, 6.5, 68, 20], [['4 biscuits', 40]]),
  chocolate: food('Chocolate bar', 'Breakfast & snacks', [535, 7.5, 58, 30], [['1 small bar', 45]]),
  popcorn: food('Popcorn', 'Breakfast & snacks', [450, 9, 58, 20], [['1 bowl', 35]]),

  // Drinks (per 100 ml)
  milk: food('Milk (whole)', 'Drinks', [61, 3.2, 4.8, 3.3], [['1 glass', 250], ['1 packet (500 ml)', 500]]),
  milkLow: food('Milk (low fat)', 'Drinks', [42, 3.4, 5, 1], [['1 glass', 250], ['1 packet (500 ml)', 500]]),
  mala: food('Mala / yoghurt', 'Drinks', [64, 3.3, 5, 3.4], [['1 glass', 250], ['1 packet (500 ml)', 500]]),
  chai: food('Chai (milk + sugar)', 'Drinks', [45, 1, 7, 1.4], [['1 cup', 200]]),
  chaiNoSugar: food('Chai (no sugar)', 'Drinks', [20, 1, 1.5, 1.1], [['1 cup', 200]]),
  coffeeBlack: food('Black coffee or tea', 'Drinks', [2, 0.1, 0.3, 0], [['1 cup', 250]]),
  juice: food('Fruit juice', 'Drinks', [46, 0.4, 11, 0.1], [['1 glass', 250]]),
  soda: food('Soda', 'Drinks', [42, 0, 10.6, 0], [['1 bottle (500 ml)', 500], ['1 small bottle (300 ml)', 300]]),
  beer: food('Beer', 'Drinks', [43, 0.5, 3.6, 0], [['1 bottle (500 ml)', 500]]),

  // Eating out
  rolex: food('Rolex (chapati + eggs)', 'Eating out', [180, 6.4, 18, 9.5], [['1 rolex', 250]]),
  chipsPlate: food('Chips / fries', 'Eating out', [310, 3.4, 38, 16], [['1 portion', 150], ['1 large portion', 250]]),
  mutura: food('Mutura', 'Eating out', [200, 10, 8, 14], [['1 portion', 150]]),
  burger: food('Burger', 'Eating out', [250, 12.5, 24, 11.5], [['1 burger', 200]]),
  pizza: food('Pizza', 'Eating out', [265, 11, 33, 10], [['1 slice', 107]]),
};

const round1 = (n) => Math.round(n * 10) / 10;

// Calories and macros for an amount of a food in grams (or ml).
export function amountOf(item, grams) {
  const k = grams / 100;
  const { kcal, p, c, f } = item.per100;
  return { kcal: Math.round(kcal * k), p: round1(p * k), c: round1(c * k), f: round1(f * k) };
}

export const portionLabel = (item, i = 0) => `${item.portions[i].label} (~${item.portions[i].g} ${item.unit})`;

// Shortcuts for the usual portion, so the list and meal ideas read like before:
// foods.ugali.portion = '1 medium piece (~250 g)', foods.ugali.kcal = 300, .p, .c, .f.
for (const item of Object.values(foods)) Object.assign(item, { portion: portionLabel(item) }, amountOf(item, item.portions[0].g));

export const PORTIONS = [0.5, 1, 1.5, 2, 3];
