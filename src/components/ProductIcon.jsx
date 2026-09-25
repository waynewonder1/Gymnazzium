// Simple line icons used as product placeholders until real photos are added.
const paths = {
  rope: <><path d="M12 44C12 8 52 8 52 44" /><rect x="8" y="44" width="8" height="14" rx="3" /><rect x="48" y="44" width="8" height="14" rx="3" /></>,
  mat: <><rect x="6" y="26" width="42" height="22" rx="4" /><circle cx="48" cy="37" r="11" /><circle cx="48" cy="37" r="5" /></>,
  pushup: <path d="M6 48 12 32h12l6 16M34 48l6-16h12l6 16M12 32V26h12v6M40 32v-6h12v6" />,
  bar: <><path d="M6 18h52M12 12v12M52 12v12" /><circle cx="32" cy="32" r="5" /><path d="M24 18l4 10M40 18l-4 10M32 37v12M32 42l-8 8M32 42l8 8" /></>,
  band: <><rect x="6" y="20" width="52" height="24" rx="12" /><rect x="13" y="27" width="38" height="10" rx="5" /></>,
  dumbbell: <><rect x="6" y="22" width="8" height="20" rx="2" /><rect x="14" y="17" width="7" height="30" rx="2" /><rect x="43" y="17" width="7" height="30" rx="2" /><rect x="50" y="22" width="8" height="20" rx="2" /><path d="M21 32h22" /></>,
  kettlebell: <><path d="M24 29v-9a8 8 0 0 1 16 0v9" /><circle cx="32" cy="41" r="15" /></>,
  wheel: <><circle cx="32" cy="32" r="16" /><circle cx="32" cy="32" r="4" /><path d="M6 32h10M48 32h10" /></>,
  grip: <><path d="M22 10l6 30M42 10l-6 30" /><path d="M28 40a6 6 0 0 0 8 0" /><circle cx="32" cy="48" r="6" /></>,
  shirt: <path d="M22 10 10 18l4 10 6-3v29h24V25l6 3 4-10-12-8c-2 6-18 6-20 0Z" />,
  tank: <path d="M24 8v8c0 6-6 10-6 16v22h28V32c0-6-6-10-6-16V8M24 16c4 6 12 6 16 0" />,
  hoodie: <><path d="M22 12 8 22v26h8V28v26h32V28v20h8V22L42 12c-2 8-18 8-20 0Z" /><path d="M22 12c0-10 20-10 20 0M28 20v8M36 20v8" /></>,
  cap: <><path d="M12 40c0-18 32-18 34 0Z" /><path d="M46 40h12" /><circle cx="29" cy="24" r="2" /></>,
  bottle: <><rect x="20" y="20" width="24" height="38" rx="4" /><path d="M23 20v-8h18v8M20 30h24" /></>,
  towel: <><rect x="16" y="8" width="32" height="48" rx="3" /><path d="M16 46h32M16 50h32" /></>,
};

function ProductIcon({ name }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] ?? paths.dumbbell}
    </svg>
  );
}

export default ProductIcon;
