import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useCart } from '../context/cart';
import { useMember } from '../context/member';
import { checkReminder } from '../lib/reminders';
import CartDrawer from './CartDrawer';
import { drop, dropOpen, shopConfig } from '../data/shop';
import InstallButton from './InstallButton';
import { isStandalone } from '../lib/install';
import RestBar from './RestBar';
import BadgeToast from './BadgeToast';
import Feedback from './Feedback';
import Welcome from './Welcome';
import { pagesByKind } from '../data/content';

const SITE = 'Gymnazzium';
const PAGE_TITLES = {
  '/plan': 'My plan',
  '/plan/routine': 'My routine',
  '/progress': 'My progress',
  '/challenges': 'Challenges',
  '/privacy': 'Privacy',
  '/shop': 'Merch',
  '/exercises': 'Exercise library',
  '/login': 'Log in',
  '/account': 'Account',
  '/admin': 'Admin',
};

// Browser-tab title for each page, e.g. "Gym work · Gymnazzium".
function titleFor(pathname) {
  const topic = pathname.match(/^\/(paths|body-types|learn)\/([^/]+)/);
  const name = topic ? pagesByKind[topic[1]]?.find((p) => p.slug === topic[2])?.title : PAGE_TITLES[pathname];
  return name ? `${name} · ${SITE}` : `${SITE}: get in shape your way`;
}

function Layout() {
  const { pathname, hash, state } = useLocation();
  const { count, setOpen } = useCart();
  const { backendEnabled, user, isAdmin, profile, online, pendingSync } = useMember();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  // Jump to #section links, otherwise start each page at the top.
  useEffect(() => {
    const target = hash && document.getElementById(hash.slice(1));
    if (target) target.scrollIntoView();
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);

  useEffect(() => {
    document.title = titleFor(pathname);
  }, [pathname]);

  // Scroll-reveal effect, re-run for each page.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll('.reveal:not(.visible)').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  // In-tab reminders (the fallback when push notifications aren't set up).
  useEffect(() => {
    checkReminder();
    const id = setInterval(checkReminder, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <nav className={menuOpen ? 'menu-open' : ''}>
        <Link to="/" className="logo" onClick={closeMenu}>GYMNAZZIUM<span>.</span></Link>
        <div className="nav-links" id="site-menu">
          <Link to="/#paths" onClick={closeMenu}>Paths</Link>
          <NavLink to="/exercises" onClick={closeMenu}>Exercises</NavLink>
          <NavLink to="/learn/nutrition" onClick={closeMenu}>Nutrition</NavLink>
          <NavLink to="/shop" onClick={closeMenu}>{shopConfig.storeOpen ? 'Shop' : 'Merch'}</NavLink>
          {profile ? <NavLink to="/plan" onClick={closeMenu}>My plan</NavLink> : <Link to="/#register" onClick={closeMenu}>Register</Link>}
          {profile && <NavLink to="/challenges" onClick={closeMenu}>Challenges</NavLink>}
          {isAdmin && <NavLink to="/admin" onClick={closeMenu}>Admin</NavLink>}
          {!isStandalone() && <Link to="/#get-the-app" className="nav-install-link" onClick={closeMenu}>Install app</Link>}
          {backendEnabled && (user ? <NavLink to="/account" onClick={closeMenu}>Account</NavLink> : <NavLink to="/login" onClick={closeMenu}>Log in</NavLink>)}
        </div>
        <div className="nav-actions">
          {!online && (
            <span className="offline-pill" role="status" title="No internet. Your workouts and logs are saved on this device and sync when you're back online.">
              Offline
            </span>
          )}
          {online && pendingSync && user && <span className="offline-pill syncing" role="status">Syncing…</span>}
          <InstallButton />
          {shopConfig.storeOpen && (
            <button className="cart-btn" onClick={() => setOpen(true)} aria-label={`Open cart, ${count} items`}>
              Cart<span className="cart-count">{count}</span>
            </button>
          )}
          {!shopConfig.storeOpen && dropOpen() && pathname !== '/shop' && (
            <Link to="/shop" className="drop-pill" onClick={closeMenu}>🔥 {drop.name}</Link>
          )}
          <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="site-menu" aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <main>
        {state?.notice && <p className="notice-banner" role="status">{state.notice}</p>}
        <Outlet />
      </main>

      {shopConfig.storeOpen && <CartDrawer />}
      <RestBar />
      <BadgeToast />
      <Feedback />
      <Welcome />

      <footer>
        <div className="footer-grid">
          <div>
            <div className="logo">GYMNAZZIUM<span>.</span></div>
            <p>Discipline · Consistency · Commitment</p>
          </div>
          <div>
            <strong>Paths</strong>
            <Link to="/paths/home-workout">Home workout</Link>
            <Link to="/paths/gym-work">Gym work</Link>
            <Link to="/paths/calisthenics">Calisthenics</Link>
            <Link to="/paths/overall-cardio">Overall cardio</Link>
          </div>
          <div>
            <strong>Learn</strong>
            <Link to="/learn/muscle-building">Muscle building</Link>
            <Link to="/learn/nutrition">Nutrition</Link>
            <Link to="/learn/supplements">Supplements</Link>
            <Link to="/exercises">Exercise library</Link>
          </div>
          <div>
            <strong>Gymnazzium</strong>
            <Link to={profile ? '/plan' : '/#register'}>{profile ? 'My plan' : 'Build my plan'}</Link>
            {profile && <Link to="/challenges">Challenges</Link>}
            <Link to="/shop">{shopConfig.storeOpen ? 'Shop' : 'Merch'}</Link>
            {backendEnabled && <Link to={user ? '/account' : '/login'}>{user ? 'Account' : 'Log in'}</Link>}
            <Link to="/privacy">Privacy</Link>
          </div>
        </div>
        <p className="footer-note">This guide is general fitness information, not medical advice. Check with a doctor before starting a new training or diet programme.</p>
      </footer>
    </>
  );
}

export default Layout;
