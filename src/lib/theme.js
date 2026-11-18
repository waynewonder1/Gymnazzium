// Light / dark theme, saved per device. Dark is the default (the Gymnazzium look).
// index.html applies the saved choice before the page draws; this switches it afterwards.
const KEY = 'gymnazzium-theme';
const BAR = { dark: '#0A0E0C', light: '#0A0E0C' }; // browser bar colour on phones: matches the always-dark top bar

export function currentTheme() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function setTheme(theme) {
  if (theme === 'light') document.documentElement.dataset.theme = 'light';
  else delete document.documentElement.dataset.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR[theme] ?? BAR.dark);
  try {
    if (theme === 'light') localStorage.setItem(KEY, 'light');
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the theme still changes for this visit.
  }
}
