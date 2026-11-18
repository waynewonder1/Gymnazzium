import { useState } from 'react';
import { currentTheme, setTheme } from '../lib/theme';

// ☀️ / 🌙 button in the top bar.
function ThemeToggle() {
  const [theme, setState] = useState(currentTheme);
  const next = theme === 'light' ? 'dark' : 'light';
  const toggle = () => {
    setTheme(next);
    setState(next);
  };
  return (
    <button type="button" className="theme-btn" onClick={toggle} aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`}>
      <span aria-hidden="true">{theme === 'light' ? '🌙' : '☀️'}</span>
    </button>
  );
}

export default ThemeToggle;
