// Shop catalogue. Prices are placeholders — set your real prices here.
//
// image:          optional path to a photo in /public (e.g. '/shop/jump-rope.jpg'); falls back to the icon
// icon:           line icon shown when there's no photo (see components/ProductIcon.jsx)
// sizes:          optional list; shows a size picker
// recommendedFor: paths, goals or challenges this product suits — used for "Gear for your plan"
export const shopConfig = {
  currency: 'KES',
  // Orders are sent to this WhatsApp number (international format, digits only, e.g. '254712345678').
  // Leave empty until you're ready to take orders.
  whatsappNumber: '',
  deliveryNote: 'Delivery within Nairobi in 1–2 days. Countrywide via courier.',
  // false = the shop is switched off: no Shop link, cart or product suggestions anywhere,
  // and /shop shows "Merch is coming soon". Set to true to bring it back.
  storeOpen: false,
};

export const products = [
  // ---------- Equipment ----------
  { id: 'jump-rope', category: 'equipment', name: 'Speed jump rope', price: 850, icon: 'rope', description: 'Adjustable steel cable with ball-bearing handles. The cheapest fat-burner you can own.', recommendedFor: ['Overall cardio', 'Lose fat', 'Improve stamina', 'Tight budget', 'Home workout'] },
  { id: 'mat', category: 'equipment', name: 'Exercise mat (10 mm)', price: 1500, icon: 'mat', description: 'Thick, non-slip mat for crunches, planks and stretching. Comes with a carry strap.', recommendedFor: ['Home workout', 'Get toned / defined', 'No gym access'] },
  { id: 'pushup-bars', category: 'equipment', name: 'Push-up bars', price: 1200, icon: 'pushup', description: 'Deeper push-ups and less wrist strain. Folds flat.', recommendedFor: ['Home workout', 'Calisthenics', 'Build muscle'] },
  { id: 'pullup-bar', category: 'equipment', name: 'Doorway pull-up bar', price: 2800, icon: 'bar', description: 'Fits standard door frames with no drilling. Pull-ups, dead hangs and knee raises.', recommendedFor: ['Calisthenics', 'Home workout', 'Get stronger', 'No gym access'] },
  { id: 'bands', category: 'equipment', name: 'Resistance band set (5)', price: 1800, icon: 'band', description: 'Five resistance levels for reverse flys, assisted pull-ups and warm-ups.', recommendedFor: ['Home workout', 'Calisthenics', 'No gym access', 'Injury or pain'] },
  { id: 'dumbbells', category: 'equipment', name: 'Adjustable dumbbells (2 × 10 kg)', price: 6500, icon: 'dumbbell', description: 'Spin-lock plates adjust from 2.5 to 10 kg per hand. Curls, presses and rows at home.', recommendedFor: ['Gym work', 'Build muscle', 'Get stronger'] },
  { id: 'kettlebell', category: 'equipment', name: 'Kettlebell (12 kg)', price: 4200, icon: 'kettlebell', description: 'Cast iron. Swings, goblet squats and carries.', recommendedFor: ['Gym work', 'Lose fat', 'Get stronger'] },
  { id: 'ab-wheel', category: 'equipment', name: 'Ab roller wheel', price: 1100, icon: 'wheel', description: 'Double wheel for stability, with a knee pad included. A serious core burner.', recommendedFor: ['Get toned / defined', 'Home workout'] },
  { id: 'grip', category: 'equipment', name: 'Hand grip strengthener', price: 600, icon: 'grip', description: 'Adjustable 10–40 kg. Train your forearms anywhere.', recommendedFor: ['Get stronger', 'Build muscle', 'Not enough time'] },

  // ---------- Merchandise ----------
  { id: 'tee', category: 'merch', name: 'Gymnazzium training tee', price: 1500, icon: 'shirt', sizes: ['S', 'M', 'L', 'XL'], description: 'Breathable, quick-dry fabric. Built to be sweated in.' },
  { id: 'tank', category: 'merch', name: 'Stringer tank', price: 1300, icon: 'tank', sizes: ['S', 'M', 'L', 'XL'], description: 'Deep-cut stringer for pump days.' },
  { id: 'hoodie', category: 'merch', name: 'Discipline hoodie', price: 3200, icon: 'hoodie', sizes: ['S', 'M', 'L', 'XL'], description: 'Heavyweight hoodie with DISCIPLINE · CONSISTENCY · COMMITMENT printed on the back.' },
  { id: 'cap', category: 'merch', name: 'Gymnazzium cap', price: 1000, icon: 'cap', description: 'Curved brim, adjustable strap, embroidered logo.' },
  { id: 'shaker', category: 'merch', name: 'Shaker bottle (700 ml)', price: 900, icon: 'bottle', description: 'Leak-proof with a mixing ball. BPA-free.', recommendedFor: ['Build muscle'] },
  { id: 'towel', category: 'merch', name: 'Gym towel', price: 700, icon: 'towel', description: 'Microfibre, fast-drying, with a logo patch.' },
];

export const formatPrice = (n) => `${shopConfig.currency} ${n.toLocaleString('en-KE')}`;
