import { NavLink } from 'react-router-dom';

// Phones, members with a plan: the main places one tap away, like an app. "More" opens the top menu.
const TABS = [
  { to: '/plan', icon: '🏠', label: 'Today' },
  { to: '/exercises', icon: '💪', label: 'Exercises' },
  { to: '/progress', icon: '📈', label: 'Progress' },
  { to: '/coach', icon: '🧠', label: 'Coach' },
];

function TabBar({ onMore, menuOpen }) {
  return (
    // Not a <nav> element: the stylesheet treats every <nav> as the top bar.
    <div className="tab-bar" role="navigation" aria-label="Main">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} className="tab">
          <span className="tab-icon" aria-hidden="true">{t.icon}</span>
          <span className="tab-label">{t.label}</span>
        </NavLink>
      ))}
      <button type="button" className={`tab${menuOpen ? ' active' : ''}`} onClick={onMore} aria-expanded={menuOpen} aria-controls="site-menu">
        <span className="tab-icon" aria-hidden="true">☰</span>
        <span className="tab-label">More</span>
      </button>
    </div>
  );
}

export default TabBar;
