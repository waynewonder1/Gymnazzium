import { challenges, milestones } from '../../data/coaching';
import { addDays, parseDate } from '../../lib/plan';

function Obstacles({ profile, today, totalDays }) {
  const upcoming = milestones.filter((m) => m.day >= Math.max(today, 0) && m.day < totalDays).slice(0, 3);
  const start = parseDate(profile.startDate);

  return (
    <div className="obstacles">
      <div>
        <h3 className="sub-title">Your challenges</h3>
        {profile.challenges.length === 0 && !profile.challengesNote ? (
          <p className="muted">You didn't list any challenges. If something starts getting in your way, edit your details and we'll plan around it.</p>
        ) : (
          <ul className="strategy-list">
            {profile.challenges.map((c) => (
              <li key={c}>
                <strong>{c}</strong>
                <p>{challenges[c]}</p>
              </li>
            ))}
            {profile.challengesNote && (
              <li>
                <strong>You also said</strong>
                <p>“{profile.challengesNote}”. Write down one small thing you'll do the next time it happens, and keep it where you'll see it.</p>
              </li>
            )}
          </ul>
        )}
      </div>

      <div>
        <h3 className="sub-title">Coming up</h3>
        {upcoming.length === 0 ? (
          <p className="muted">No more big milestones in this plan. Keep stacking days.</p>
        ) : (
          <ol className="timeline">
            {upcoming.map((m) => (
              <li key={m.day}>
                <span className="timeline-date">
                  Day {m.day + 1} · {addDays(start, m.day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
                <strong>{m.title}</strong>
                <p>{m.text}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

export default Obstacles;
