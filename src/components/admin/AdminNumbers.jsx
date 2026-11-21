import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const pct = (n, of) => (of ? `${Math.round((n / of) * 100)}%` : '–');
const weekLabel = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

// Weekly bars: one series, so the title names it and each bar has its value + a hover tooltip.
function WeekBars({ title, note, weeks, field, unit }) {
  const max = Math.max(1, ...weeks.map((w) => w[field]));
  return (
    <div className="card flat numbers-chart">
      <h3>{title}</h3>
      {note && <p className="muted small">{note}</p>}
      <div className="week-bars" role="img" aria-label={`${title}: ${weeks.map((w) => `week of ${weekLabel(w.week)} ${w[field]}`).join(', ')}`}>
        {weeks.map((w, i) => (
          <div className="week-bar" key={w.week} title={`Week of ${weekLabel(w.week)}: ${w[field]} ${unit}`}>
            <span className="week-bar-value">{w[field]}</span>
            <span className={`week-bar-fill${i === weeks.length - 1 ? ' current' : ''}`} style={{ height: `${(w[field] / max) * 100}%` }} />
            <span className="week-bar-label">{weekLabel(w.week)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminNumbers() {
  const [n, setN] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    supabase.rpc('admin_numbers').then(({ data, error: e }) => {
      if (cancelled) return;
      setN(data ?? null);
      setError(e?.message ?? '');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="banner warn">Numbers couldn't load: {error}</p>;
  if (!n) return <p className="muted small">Loading numbers…</p>;

  const f = n.funnel;
  const steps = [
    ['Signed up', f.signed_up],
    ['Built a plan', f.has_plan],
    ['Did 1+ workout', f.trained_1],
    ['Did 3+ workouts', f.trained_3],
    ['Did 10+ workouts', f.trained_10],
  ];

  return (
    <div className="admin-numbers">
      <h2 className="sub-title">Numbers</h2>
      <p className="muted small">Members with an account only. Plans kept on a phone without an account aren't counted. A workout counts when a day is ticked done or a set is logged.</p>

      <div className="stat-grid admin-stats">
        <div className="stat"><span className="stat-label">Trained today</span><strong className="stat-value">{n.trained_1d}</strong><span className="stat-note">members</span></div>
        <div className="stat"><span className="stat-label">Trained this week</span><strong className="stat-value">{n.trained_7d}</strong><span className="stat-note">last 7 days · {pct(n.trained_7d, n.members)} of members</span></div>
        <div className="stat"><span className="stat-label">Trained this month</span><strong className="stat-value">{n.trained_30d}</strong><span className="stat-note">last 30 days · {pct(n.trained_30d, n.members)} of members</span></div>
        <div className="stat"><span className="stat-label">Came back in week 2</span><strong className="stat-value">{pct(n.came_back.returned, n.came_back.eligible)}</strong><span className="stat-note">{n.came_back.returned} of {n.came_back.eligible} who joined 2+ weeks ago</span></div>
      </div>

      <div className="grid grid-2 admin-lower">
        <WeekBars title="Members who trained, per week" weeks={n.weekly} field="trained" unit="members" note="This week is still running (last bar)." />
        <WeekBars title="Sign-ups, per week" weeks={n.weekly} field="signups" unit="sign-ups" />
      </div>

      <div className="grid grid-2 admin-lower">
        <div className="card flat">
          <h3>From sign-up to habit</h3>
          <ul className="funnel">
            {steps.map(([label, v]) => (
              <li key={label} title={`${label}: ${v} (${pct(v, f.signed_up)})`}>
                <span className="funnel-label">{label}</span>
                <span className="funnel-track"><span className="funnel-fill" style={{ width: pct(v, f.signed_up) === '–' ? 0 : pct(v, f.signed_up) }} /></span>
                <span className="funnel-value">{v} <span className="muted">· {pct(v, f.signed_up)}</span></span>
              </li>
            ))}
          </ul>
          <p className="muted small">Reminders on: {f.reminders} ({pct(f.reminders, f.signed_up)}) · opened the app this week: {n.opened_7d}</p>
        </div>
        <div className="card flat">
          <h3>Do they keep training?</h3>
          <p className="muted small">Members by the week they joined, and the share who trained in each week after.</p>
          <div className="table-scroll">
            <table className="admin-table cohort-table">
              <thead><tr><th scope="col">Joined</th><th scope="col">People</th><th scope="col">Wk 1</th><th scope="col">Wk 2</th><th scope="col">Wk 3</th><th scope="col">Wk 4</th></tr></thead>
              <tbody>
                {n.cohorts.filter((c) => c.joined > 0).map((c) => (
                  <tr key={c.week}>
                    <td>{weekLabel(c.week)}</td>
                    <td>{c.joined}</td>
                    {['w1', 'w2', 'w3', 'w4'].map((k, i) => (
                      <td key={k}>{c.age_days >= i * 7 ? pct(c[k], c.joined) : <span className="muted">–</span>}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <table className="sr-only">
        <caption>Per week</caption>
        <thead><tr><th>Week</th><th>Sign-ups</th><th>Trained</th><th>Workouts</th><th>Posts</th><th>Feedback</th></tr></thead>
        <tbody>{n.weekly.map((w) => <tr key={w.week}><td>{weekLabel(w.week)}</td><td>{w.signups}</td><td>{w.trained}</td><td>{w.workouts}</td><td>{w.posts}</td><td>{w.feedback}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

export default AdminNumbers;
