import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useCart } from '../context/cart';
import { useMember } from '../context/member';
import { checkReminder } from '../lib/reminders';
import CartDrawer from './CartDrawer';

function Layout() {
  const { pathname, hash } = useLocation();
  const { count, setOpen } = useCart();
  const { backendEnabled, user, profile } = useMember();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  // Jump to #section links, otherwise start each page at the top.
  useEffect(() => {
    const target = hash && document.getElementById(hash.slice(1));
    if (target) target.scrollIntoView();
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);

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
          <NavLink to="/shop" onClick={closeMenu}>Shop</NavLink>
          {profile ? <NavLink to="/plan" onClick={closeMenu}>My plan</NavLink> : <Link to="/#register" onClick={closeMenu}>Register</Link>}
          {backendEnabled && (user ? <NavLink to="/account" onClick={closeMenu}>Account</NavLink> : <NavLink to="/login" onClick={closeMenu}>Log in</NavLink>)}
        </div>
        <div className="nav-actions">
          <button className="cart-btn" onClick={() => setOpen(true)} aria-label={`Open cart, ${count} items`}>
            Cart<span className="cart-count">{count}</span>
          </button>
          <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="site-menu" aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>

      <CartDrawer />

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
            <Link to="/shop">Shop</Link>
            {backendEnabled && <Link to={user ? '/account' : '/login'}>{user ? 'Account' : 'Log in'}</Link>}
          </div>
        </div>
        <p className="footer-note">This guide is general fitness information, not medical advice. Check with a doctor before starting a new training or diet programme.</p>
      </footer>
    </>
  );
}

export default Layout;
