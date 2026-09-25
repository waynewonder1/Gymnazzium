import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { products } from '../data/shop';
import { addDays, getDay, parseDate, phaseInfo, streak, todayIndex, totalDays, usesRoutine } from '../lib/plan';
import { useMember } from '../context/member';
import DayCard from '../components/plan/DayCard';
import WeekStrip from '../components/plan/WeekStrip';
import PlanOverview from '../components/plan/PlanOverview';
import Reminders from '../components/plan/Reminders';
import Obstacles from '../components/plan/Obstacles';
import DeepDive from '../components/plan/DeepDive';
import ProductCard from '../components/ProductCard';

function Plan() {
  const { profile, authReady, syncing } = useMember();

  if (!profile && (!authReady || syncing)) {
    return (
      <section className="page-top">
        <p className="muted">Loading your plan…</p>
      </section>
    );
  }
  if (!profile) {
    return (
      <section className="page-top">
        <div className="section-label">Your plan</div>
        <h1 className="page-title">No plan yet.</h1>
        <p className="page-lead">Register first. It takes two minutes, and we'll build your day-by-day plan from your answers.</p>
        <Link to="/#register" className="btn">Build my plan</Link>
      </section>
    );
  }
  return <PlanView profile={profile} />;
}

function recommendedGear(profile) {
  const tags = [profile.lookingFor, ...profile.goals, ...profile.challenges];
  return products
    .map((p) => ({ p, score: (p.recommendedFor ?? []).filter((t) => tags.includes(t)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.p);
}

function PlanView({ profile }) {
  const navigate = useNavigate();
  const { backendEnabled, user, progress, saveProfile, saveProgress, clearPlan, syncError } = useMember();
  const total = totalDays(profile);
  const today = todayIndex(profile);
  const clamp = (i) => Math.min(Math.max(i, 0), total - 1);

  const [selected, setSelected] = useState(clamp(today));
  const [week, setWeek] = useState(Math.floor(clamp(today) / 7));
  const day = getDay(profile, selected);

  const commit = saveProgress;

  const toggleCheck = (j) => {
    const key = `${selected}:${j}`;
    const checks = { ...progress.checks, [key]: !progress.checks[key] };
    const done = { ...progress.done };
    // Ticking every exercise completes the workout.
    if (day.items.every((_, k) => checks[`${selected}:${k}`])) done[selected] = true;
    commit({ ...progress, checks, done });
  };

  // Logged sets for one exercise. Logging reps on every set ticks the exercise off too.
  const logLift = (j, id, sets) => {
    const forExercise = { ...progress.lifts?.[id] };
    const hasAny = sets.some((s) => s.r > 0 || s.w > 0);
    if (hasAny) forExercise[selected] = sets;
    else delete forExercise[selected];
    const lifts = { ...progress.lifts, [id]: forExercise };
    const checks = { ...progress.checks };
    const done = { ...progress.done };
    if (sets.length > 0 && sets.every((s) => s.r > 0)) {
      checks[`${selected}:${j}`] = true;
      if (day.items.every((_, k) => checks[`${selected}:${k}`])) done[selected] = true;
    }
    commit({ ...progress, lifts, checks, done });
  };

  const switchToRecommended = () => {
    if (!window.confirm('Switch back to the recommended plan? Your routine stays saved, so you can switch back any time.')) return;
    saveProfile({ ...profile, planMode: undefined });
  };

  const toggleIn = (field) => () => {
    const next = { ...progress[field] };
    if (next[selected]) delete next[selected];
    else next[selected] = true;
    commit({ ...progress, [field]: next });
  };

  const relationOf = (i) => (i < today ? 'past' : i === today ? 'today' : 'future');
  const statusOf = (i) => {
    const d = getDay(profile, i);
    const rel = relationOf(i);
    if (d.type === 'rest') return { type: 'rest', rel, title: d.title };
    return { type: 'train', rel, title: d.title, state: progress.done[i] ? 'done' : rel === 'past' ? 'missed' : 'todo' };
  };
  const dateOf = (i) => addDays(parseDate(profile.startDate), i);

  const select = (i, scroll = false) => {
    setSelected(i);
    setWeek(Math.floor(i / 7));
    if (scroll) document.getElementById('today')?.scrollIntoView();
  };

  const changeTime = (workoutTime) => saveProfile({ ...profile, workoutTime });

  const startOver = async () => {
    if (!window.confirm('Delete your plan and progress and start again?')) return;
    await clearPlan();
    navigate('/#register');
  };

  // Stats
  const upTo = Math.min(today, total - 1);
  let sessionsSoFar = 0;
  for (let i = 0; i <= upTo; i++) if (getDay(profile, i).type === 'train') sessionsSoFar++;
  const sessionsDone = Object.keys(progress.done).length;
  const current = clamp(today);
  const phase = phaseInfo(profile, current);
  const pct = Math.min(100, Math.max(0, ((today + 1) / total) * 100));
  const gear = recommendedGear(profile);

  return (
    <>
      <section className="page-top plan-header">
        <div className="section-label">Your plan</div>
        <h1 className="page-title">Let's work, {profile.name}.</h1>
        <p className="page-lead">
          {profile.timeline} to {profile.goals.join(', ').toLowerCase()}. {profile.lookingFor}, {profile.schedule}, {profile.level.toLowerCase()} level.
        </p>

        {backendEnabled && !user && (
          <p className="banner">
            This plan is only saved on this device. <Link to="/login" state={{ next: '/plan' }}>Create a free account</Link> to keep it safe, use it on your phone and laptop, and get push reminders.
          </p>
        )}
        {syncError && <p className="banner warn">Couldn't save to your account ({syncError}). Your changes are kept on this device. We'll try again on your next change.</p>}
        {today < 0 && <p className="banner">Your plan starts on {dateOf(0).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}. Here's a preview of day one.</p>}
        {today >= total && <p className="banner">You finished your {profile.timeline} plan. Update your details to set the next target.</p>}

        <div className="progress-bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin="0" aria-valuemax="100">
          <div style={{ width: `${pct}%` }} />
        </div>

        <div className="stat-grid">
          <div className="stat"><span className="stat-label">Day</span><strong className="stat-value">{Math.max(0, Math.min(today + 1, total))} / {total}</strong></div>
          <div className="stat"><span className="stat-label">Streak</span><strong className="stat-value">{streak(profile, progress.done)} 🔥</strong><span className="stat-note">Workouts in a row</span></div>
          <div className="stat"><span className="stat-label">Workouts done</span><strong className="stat-value">{sessionsDone} / {sessionsSoFar}</strong><span className="stat-note">So far</span></div>
          <div className="stat"><span className="stat-label">{phase.label}</span><strong className="stat-value">{phase.value}</strong><span className="stat-note">{phase.note}</span></div>
        </div>

        {usesRoutine(profile) ? (
          <p className="banner routine-banner">
            You're following <strong>your own routine</strong>. <Link to="/plan/routine">Edit it</Link> · <button type="button" className="link-btn" onClick={switchToRecommended}>Switch back to the recommended plan</button>
          </p>
        ) : (
          <div className="customize-cta">
            <div>
              <strong>Want it your way?</strong>
              <span className="muted small">Build your own weekly routine: pick your days, exercises, sets and reps.</span>
            </div>
            <Link to="/plan/routine" className="btn btn-sm">{profile.routine ? 'Use my routine' : 'Customize my plan'}</Link>
          </div>
        )}

        <div className="chips plan-nav">
          <Link className="chip" to="/progress">My progress</Link>
          <a className="chip" href="#today">Day by day</a>
          <a className="chip" href="#reminders">Reminders</a>
          <a className="chip" href="#obstacles">Obstacles</a>
          <a className="chip" href="#goal">Your goal in depth</a>
          {gear.length > 0 && <a className="chip" href="#gear">Gear</a>}
        </div>
      </section>

      <section id="today" className="plan-section">
        <div className="section-label">Day by day</div>
        <WeekStrip
          week={week}
          totalDays={total}
          selected={selected}
          onSelect={(i) => select(i)}
          onWeek={setWeek}
          statusOf={statusOf}
          dateOf={dateOf}
        />
        <DayCard
          day={day}
          relation={relationOf(selected)}
          progress={progress}
          onToggleCheck={toggleCheck}
          onToggleDone={toggleIn('done')}
          onToggleMission={toggleIn('missions')}
          onLog={logLift}
        />
        {selected !== current && (
          <button className="btn btn-ghost back-today" onClick={() => select(current)}>Back to today</button>
        )}
        <PlanOverview totalDays={total} selected={selected} onSelect={(i) => select(i, true)} statusOf={statusOf} />
      </section>

      <section id="reminders" className="plan-section">
        <div className="section-label">Reminders</div>
        <h2 className="section-title">Never forget a session.</h2>
        <Reminders profile={profile} onChangeTime={changeTime} />
      </section>

      <section id="obstacles" className="plan-section">
        <div className="section-label">Obstacles</div>
        <h2 className="section-title">What's going to try to stop you, and what to do about it.</h2>
        <Obstacles profile={profile} today={today} totalDays={total} />
      </section>

      <section id="goal" className="plan-section">
        <div className="section-label">Your goal in depth</div>
        <h2 className="section-title">How you'll actually get there.</h2>
        <DeepDive profile={profile} />
      </section>

      {gear.length > 0 && (
        <section id="gear" className="plan-section">
          <div className="section-label">Gear for your plan</div>
          <h2 className="section-title">What would help most.</h2>
          <div className="product-grid">
            {gear.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          <Link to="/shop" className="btn btn-ghost see-all">See the full shop →</Link>
        </section>
      )}

      <section className="plan-section plan-actions">
        <button className="btn btn-ghost" onClick={() => navigate('/#register', { state: { edit: true } })}>Edit my details</button>
        <button className="btn btn-ghost" onClick={startOver}>Start over</button>
      </section>
    </>
  );
}

export default Plan;
