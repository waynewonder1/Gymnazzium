import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMember } from '../context/member';
import { supabase } from '../lib/supabase';
import { toISO } from '../lib/plan';
import { MILESTONES, badgeInfo, monthKey, monthLabel, monthlyChallenges } from '../lib/challenges';

const fmtDay = (iso) => new Date(`${iso}T00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function Challenges() {
  const { profile, progress, authReady, syncing } = useMember();

  if (!profile) {
    return (
      <section className="page-top">
        {!authReady || syncing ? <p className="muted">Loading…</p> : (
          <>
            <div className="section-label">Challenges</div>
            <h1 className="page-title">No plan yet.</h1>
            <p className="page-lead">Challenges are sized to your plan. Build one first; it takes two minutes.</p>
            <Link to="/#register" className="btn">Build my plan</Link>
          </>
        )}
      </section>
    );
  }

  const now = new Date();
  const challenges = monthlyChallenges(profile, progress, now);
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
  const earned = progress.badges ?? {};
  const monthBadges = Object.keys(earned).filter((k) => k.includes(':')).sort().reverse();
  const milestonesEarned = MILESTONES.filter((m) => earned[m.id]).length;

  return (
    <section className="page-top challenges-page">
      <div className="section-label">Challenges</div>
      <h1 className="page-title">Earn it.</h1>
      <p className="page-lead">New challenges every month, sized to your plan. Finish one and its badge is yours to keep.</p>

      <div className="ch-head">
        <h2 className="sub-title">{monthLabel(monthKey(now))}</h2>
        <span className="muted small">{daysLeft === 0 ? 'Last day!' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}</span>
      </div>
      {challenges.length === 0 ? (
        <div className="card flat empty-progress">
          <p>Your plan has no workouts this month, so there's nothing to chase yet.</p>
        </div>
      ) : (
        <div className="challenge-grid">
          {challenges.map((c) => {
            const pct = Math.min(100, Math.round((c.value / c.target) * 100));
            return (
              <article key={c.id} className={`challenge${c.done ? ' done' : ''}`}>
                <div className="challenge-top">
                  <span className="challenge-icon" aria-hidden="true">{c.icon}</span>
                  <div>
                    <h3>{c.title}</h3>
                    <p>{c.goal}</p>
                  </div>
                  {c.done && <span className="challenge-check">Done ✓</span>}
                </div>
                <div className="progress-bar" role="progressbar" aria-label={c.goal} aria-valuenow={Math.min(c.value, c.target)} aria-valuemin="0" aria-valuemax={c.target}>
                  <div style={{ width: `${pct}%` }} />
                </div>
                <div className="challenge-foot">
                  <strong>{Math.min(c.value, c.target)} / {c.target}</strong>
                  <span className="muted small">{c.note}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <h2 className="sub-title">Badges <span className="muted small">{milestonesEarned + monthBadges.length} earned</span></h2>
      <div className="badge-grid">
        {MILESTONES.map((m) => (
          <div key={m.id} className={`badge${earned[m.id] ? '' : ' locked'}`} title={m.how}>
            <span className="badge-icon" aria-hidden="true">{m.icon}</span>
            <strong>{m.title}</strong>
            <span className="muted small">{earned[m.id] ? fmtDay(earned[m.id]) : m.how}</span>
          </div>
        ))}
        {monthBadges.map((key) => {
          const b = badgeInfo(key);
          return (
            <div key={key} className="badge">
              <span className="badge-icon" aria-hidden="true">{b.icon}</span>
              <strong>{b.title}</strong>
              <span className="muted small">{fmtDay(earned[key])}</span>
            </div>
          );
        })}
      </div>

      <Leaderboard />
    </section>
  );
}

function Leaderboard() {
  const { backendEnabled, user, online } = useMember();
  const [entry, setEntry] = useState(undefined); // undefined = loading, null = not joined, { display_name }
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lastMonth, setLastMonth] = useState(false);
  const [rows, setRows] = useState(null);

  const now = new Date();
  const month = new Date(now.getFullYear(), now.getMonth() - (lastMonth ? 1 : 0), 1);
  const monthISO = toISO(month);
  const userId = user?.id;
  const joined = Boolean(entry);

  useEffect(() => {
    if (!userId || !online) return;
    let cancelled = false;
    supabase.from('leaderboard_members').select('display_name').eq('user_id', userId).maybeSingle()
      .then(({ data, error: e }) => {
        if (cancelled) return;
        if (e) setError(e.message);
        setEntry(data ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, online]);

  useEffect(() => {
    if (!joined || !online) return;
    let cancelled = false;
    supabase.rpc('leaderboard', { p_month: monthISO }).then(({ data, error: e }) => {
      if (cancelled) return;
      if (e) setError(e.message);
      setRows(data ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [joined, online, monthISO, entry]);

  if (!backendEnabled) return null;

  const intro = (
    <>
      <h2 className="sub-title">Leaderboard</h2>
      <p className="page-lead">See how your month stacks up against other Gymnazzium members. Ranked by workouts done, then sets logged.</p>
    </>
  );

  if (!user) {
    return (
      <div className="leaderboard">
        {intro}
        <Link to="/login" state={{ next: '/challenges' }} className="btn btn-sm">Log in to join</Link>
      </div>
    );
  }
  if (!online) {
    return <div className="leaderboard">{intro}<p className="muted">The leaderboard needs a connection. Your challenges above still work offline.</p></div>;
  }
  if (entry === undefined) return <div className="leaderboard">{intro}<p className="muted">Loading…</p></div>;

  const save = async (e) => {
    e.preventDefault();
    const displayName = name.trim().replace(/\s+/g, ' ');
    if (displayName.length < 2 || displayName.length > 24) return setError('Pick a name of 2 to 24 characters.');
    setBusy(true);
    setError('');
    const { error: err } = await supabase.from('leaderboard_members').upsert({ user_id: userId, display_name: displayName });
    setBusy(false);
    if (err) return setError(err.code === '23505' ? 'That name is taken. Try another.' : err.message);
    setEntry({ display_name: displayName });
    setEditing(false);
  };

  const leave = async () => {
    setBusy(true);
    const { error: err } = await supabase.from('leaderboard_members').delete().eq('user_id', userId);
    setBusy(false);
    if (err) return setError(err.message);
    setEntry(null);
    setRows(null);
  };

  const nameForm = (
    <form className="inline-form lb-form" onSubmit={save}>
      <input aria-label="Display name" placeholder="Display name, e.g. Wayne K." maxLength={24} value={name} onChange={(e) => setName(e.target.value)} autoFocus={editing} />
      <button className="btn btn-sm" disabled={busy}>{joined ? 'Save name' : 'Join the leaderboard'}</button>
      {editing && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEditing(false)}>Cancel</button>}
    </form>
  );

  if (!joined) {
    return (
      <div className="leaderboard">
        {intro}
        <div className="card flat lb-join">
          <h3>Join under a display name</h3>
          <p>Other members will see your display name, your workouts and sets this month, and how many badges you have. Never your email, your plan or your weights. You can leave any time.</p>
          {nameForm}
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      {intro}
      <div className="lb-bar">
        <div className="chips" role="group" aria-label="Month">
          <button type="button" className={`chip${lastMonth ? '' : ' active'}`} aria-pressed={!lastMonth} onClick={() => setLastMonth(false)}>This month</button>
          <button type="button" className={`chip${lastMonth ? ' active' : ''}`} aria-pressed={lastMonth} onClick={() => setLastMonth(true)}>Last month</button>
        </div>
        <span className="muted small">
          You're on as <strong>{entry.display_name}</strong> ·{' '}
          <button type="button" className="link-btn" onClick={() => { setName(entry.display_name); setEditing(true); }}>Change name</button> ·{' '}
          <button type="button" className="link-btn" onClick={leave} disabled={busy}>Leave</button>
        </span>
      </div>
      {editing && nameForm}
      {error && <p className="form-error" role="alert">{error}</p>}

      {rows === null ? <p className="muted">Loading…</p> : rows.length === 0 ? (
        <p className="muted">Nobody has logged a workout {lastMonth ? 'that month' : 'yet this month'}. First one on the board wins bragging rights.</p>
      ) : (
        <div className="table-wrap">
          <table className="lb-table">
            <thead>
              <tr><th scope="col">#</th><th scope="col">Member</th><th scope="col">Workouts</th><th scope="col">Sets</th><th scope="col">Badges</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.display_name} className={r.is_me ? 'me' : ''}>
                  <td>{r.rank <= 3 && (r.workouts > 0 || r.sets > 0) ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}</td>
                  <td>{r.display_name}{r.is_me ? ' (you)' : ''}</td>
                  <td>{r.workouts}</td>
                  <td>{r.sets}</td>
                  <td>{r.badges > 0 ? `🏅 ${r.badges}` : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Challenges;
