import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMember } from '../context/member';

const SEEN_KEY = 'gymnazzium-welcomed';
const seen = () => {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return true; // storage blocked: don't nag on every visit
  }
};
const markSeen = () => {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // ignore
  }
};

const STEPS = [
  { icon: '📝', title: 'Answer a few questions', text: 'Your goals, how you like to train and how many days a week. Takes 2 minutes.' },
  { icon: '📅', title: 'Follow your plan, day by day', text: "Today's workout, form tips, reminders on your phone. Log your sets and runs." },
  { icon: '🏆', title: 'Watch yourself improve', text: 'Progress charts, personal bests, monthly challenges and badges.' },
];

// A one-time welcome for first-time visitors on the home page (not for members with a plan).
function Welcome() {
  const { profile, authReady } = useMember();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dialog = useRef(null);
  const show = pathname === '/' && authReady && !profile && !seen();

  useEffect(() => {
    if (!show) return;
    const id = setTimeout(() => dialog.current?.showModal(), 600);
    return () => clearTimeout(id);
  }, [show]);

  const close = () => {
    markSeen();
    dialog.current?.close();
  };
  const start = () => {
    close();
    navigate('/#register');
  };

  if (!show) return null;
  return (
    <dialog ref={dialog} className="welcome-dialog" aria-labelledby="welcome-title" onClose={markSeen}>
      <div className="welcome-body">
        <div className="section-label">Welcome to Gymnazzium</div>
        <h2 id="welcome-title">Your free personal training plan.</h2>
        <ol className="welcome-steps">
          {STEPS.map((s) => (
            <li key={s.title}>
              <span className="welcome-icon" aria-hidden="true">{s.icon}</span>
              <div>
                <strong>{s.title}</strong>
                <p className="muted small">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="form-actions">
          <button type="button" className="btn" onClick={start}>Build my plan</button>
          <button type="button" className="btn btn-ghost" onClick={close}>Just look around</button>
        </div>
      </div>
    </dialog>
  );
}

export default Welcome;
