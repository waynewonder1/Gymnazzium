import { weekSummary } from '../../lib/week';

const STATE_LABEL = { done: 'done', missed: 'missed', today: 'today', todo: 'coming up', rest: 'rest day', 'rest today': 'rest day (today)', none: 'outside your plan' };

function WeekSummary({ profile, progress, today }) {
  const w = weekSummary(profile, progress, today);

  return (
    <div className="week-summary">
      <div className="ws-head">
        <strong>This week</strong>
        <div className="ws-days" aria-label="This week's days">
          {w.days.map((d, k) => (
            <span key={k} className={`ws-day ${d.state}`} title={`${d.title ?? ''} ${STATE_LABEL[d.state]}`.trim()}>
              {d.letter}
            </span>
          ))}
        </div>
      </div>
      <div className="ws-stats">
        <div><strong>{w.done}<span className="muted"> / {w.planned}</span></strong><span>workouts</span></div>
        <div><strong>{w.volume.toLocaleString()}</strong><span>kg lifted</span></div>
        <div><strong>{w.sets}</strong><span>sets logged</span></div>
        <div><strong>{w.prs}{w.prs > 0 ? ' 🏆' : ''}</strong><span>new PRs</span></div>
        <div><strong>{w.streak}{w.streak > 0 ? ' 🔥' : ''}</strong><span>streak</span></div>
      </div>
    </div>
  );
}

export default WeekSummary;
