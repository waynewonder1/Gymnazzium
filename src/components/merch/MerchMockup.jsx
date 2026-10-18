// Branded stand-in picture of the tee or vest, until there are real product photos.
// To use a photo instead, add `image: '/shop/tee.jpg'` to the item in data/shop.js.
const SHAPES = {
  tee: 'M78 40 L100 31 Q120 50 140 31 L162 40 L201 63 L186 100 L166 92 L166 206 Q120 213 74 206 L74 92 L54 100 L39 63 Z',
  vest: 'M86 32 Q95 33 97 42 Q103 72 120 74 Q137 72 143 42 Q145 33 154 32 L158 34 Q159 78 178 98 L178 206 Q120 213 62 206 L62 98 Q81 78 82 34 Z',
};
// Where the chest print sits on each garment (the logo is 1012 × 762).
const LOGO = { tee: { x: 80, y: 66, w: 80 }, vest: { x: 86, y: 90, w: 68 } };
const COLLAR = { tee: 'M100 31 Q120 50 140 31', vest: 'M97 42 Q103 72 120 74 Q137 72 143 42' };

function MerchMockup({ item }) {
  if (item.image) return <img className="merch-photo" src={item.image} alt={item.name} />;
  const shape = SHAPES[item.mockup] ?? SHAPES.tee;
  return (
    <svg className="merch-mockup" viewBox="0 0 240 240" role="img" aria-label={`${item.name} (illustration)`}>
      <defs>
        <radialGradient id={`glow-${item.id}`} cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#FF4B3E" stopOpacity="0.22" />
          <stop offset="1" stopColor="#FF4B3E" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`fabric-${item.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d2521" />
          <stop offset="1" stopColor="#0f1412" />
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill={`url(#glow-${item.id})`} />
      <path d={shape} fill={`url(#fabric-${item.id})`} stroke="rgba(236,239,236,0.18)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d={COLLAR[item.mockup] ?? COLLAR.tee} fill="none" stroke="rgba(236,239,236,0.28)" strokeWidth="2" />
      {/* Chest print: the Gymnazzium metal logo. */}
      <image href="/brand/gymnazzium-metal.png" x={LOGO[item.mockup]?.x ?? LOGO.tee.x} y={LOGO[item.mockup]?.y ?? LOGO.tee.y} width={LOGO[item.mockup]?.w ?? LOGO.tee.w} height={(LOGO[item.mockup]?.w ?? LOGO.tee.w) * 0.753} />
    </svg>
  );
}

export default MerchMockup;
