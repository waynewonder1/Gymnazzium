import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMember } from '../context/member';
import { badgeInfo } from '../lib/challenges';
import Confetti from './Confetti';

// "New badge!" banner (with confetti) whenever saving progress earns one.
function BadgeToast() {
  const { celebration, dismissCelebration } = useMember();

  useEffect(() => {
    if (!celebration) return;
    const id = setTimeout(dismissCelebration, 7000);
    return () => clearTimeout(id);
  }, [celebration, dismissCelebration]);

  if (!celebration) return null;
  const badges = celebration.keys.map(badgeInfo);
  return (
    <>
      <Confetti key={celebration.at} />
      <div className="badge-toast" role="status">
        <span className="badge-toast-icons" aria-hidden="true">{badges.slice(0, 3).map((b) => b.icon).join('')}</span>
        <div>
          <strong>{badges.length === 1 ? 'New badge!' : `${badges.length} new badges!`}</strong>
          <span>{badges.map((b) => b.title).join(', ')}</span>
          <Link to="/challenges" onClick={dismissCelebration}>See your badges</Link>
        </div>
        <button type="button" className="icon-btn small-btn" onClick={dismissCelebration} aria-label="Close">✕</button>
      </div>
    </>
  );
}

export default BadgeToast;
