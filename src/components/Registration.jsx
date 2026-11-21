import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { registration } from '../data/guide';
import { challenges } from '../data/coaching';
import { RUN_GOAL, gymStyleFor, gymStyleOptions, gymStyles, recommendedGymStyle, runLevels } from '../data/workouts';
import { useMember } from '../context/member';
import { emptyProgress } from '../lib/storage';
import { toISO, todayIndex, totalDays } from '../lib/plan';

const levels = [
  { value: 'Beginner', hint: "Can't do 10 clean push-ups yet" },
  { value: 'Intermediate', hint: 'Train on and off, know the basics' },
  { value: 'Advanced', hint: 'Train consistently for a year or more' },
];

// New members answer 4 short screens; the rest has sensible defaults (3 months, 06:30, starting
// today) and can be changed later under "Edit my details", which adds a "More details" screen.
const STEPS = [
  { key: 'about', title: 'About you' },
  { key: 'goals', title: 'Level & goals' },
  { key: 'how', title: 'How you train' },
  { key: 'days', title: 'Training days' },
];
const MORE = { key: 'more', title: 'More details' };

const emptyProfile = () => ({
  name: '',
  weight: '',
  height: '',
  age: '',
  gender: '',
  level: 'Beginner',
  goals: [],
  runLevel: '',
  lookingFor: '',
  timeline: '3 months',
  schedule: '3 days a week',
  workoutTime: '06:30',
  startDate: toISO(new Date()),
  challenges: [],
  challengesNote: '',
  gymStyle: '', // '' = the recommended split for the training days
});

// Gym only: which split to follow, from the ones that fit the training days.
function SplitChoice({ profile, onPick }) {
  const current = gymStyleFor(profile);
  const best = recommendedGymStyle(profile.schedule, profile.level, profile.gender);
  return (
    <div className="split-choice">
      <p className="muted small form-hint">Your gym split for {profile.schedule.replace(' a week', '')} a week:</p>
      <div className="levels">
        {gymStyleOptions(profile.schedule, profile.level, profile.gender).map((key) => (
          <label key={key} className={`level ${current === key ? 'active' : ''}`}>
            <input type="radio" name="gymStyle" value={key} checked={current === key} onChange={() => onPick(key)} />
            <strong>{gymStyles[key].name}{key === best && <span className="tag rec-tag">Recommended</span>}</strong>
            <span>{gymStyles[key].text}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function Chips({ options, selected, onToggle }) {
  return (
    <div className="chips">
      {options.map((o) => (
        <button type="button" key={o} className={`chip ${selected.includes(o) ? 'active' : ''}`} aria-pressed={selected.includes(o)} onClick={() => onToggle(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Registration() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile: saved, progress, saveProfile, saveProgress, clearPlan } = useMember();
  // Pages like /paths/home-workout link here with some answers already picked.
  const prefill = location.state?.prefill ?? {};
  // Plans made before splits could be picked stay on the Gymnazzium split until the member picks another.
  const [profile, setProfile] = useState(() => ({ ...emptyProfile(), ...(saved && { gymStyle: 'gymnazzium' }), ...saved, ...prefill }));
  const [editing, setEditing] = useState(() => !saved || location.state?.edit === true || Boolean(location.state?.prefill));
  const [step, setStep] = useState(0);
  const steps = saved ? [...STEPS, MORE] : STEPS;
  const at = steps[step]?.key;
  // Members following their own routine (routine editor): their week ignores these answers.
  const onRoutine = saved?.planMode === 'custom' && Boolean(saved?.routine);
  const [useRecommended, setUseRecommended] = useState(true);
  const [error, setError] = useState('');
  const formRef = useRef(null);

  const update = (field) => (e) => setProfile({ ...profile, [field]: e.target.value });
  const toggle = (field) => (value) =>
    setProfile({
      ...profile,
      [field]: profile[field].includes(value) ? profile[field].filter((v) => v !== value) : [...profile[field], value],
    });

  // What's still missing on a step (the browser also checks that step's required boxes).
  const problemOn = (i) => {
    const k = steps[i]?.key;
    if (k === 'about' && !(profile.name.trim() && profile.age && profile.weight && profile.height && profile.gender)) return 'Fill in all the boxes about you.';
    if (k === 'goals' && profile.goals.length === 0) return 'Pick at least one goal.';
    if (k === 'goals' && profile.goals.includes(RUN_GOAL) && !runLevels[profile.runLevel]) return 'Pick how much you run now, so we can set your distance.';
    if (k === 'how' && !profile.lookingFor) return 'Pick how you want to train.';
    if (k === 'more' && !(profile.workoutTime && profile.startDate)) return 'Pick a workout time and a start date.';
    return '';
  };

  const goTo = (i) => {
    setError('');
    setStep(i);
    formRef.current?.scrollIntoView({ block: 'start' });
  };

  const finish = () => {
    // Check every step; jump to the first one that needs attention.
    for (let i = 0; i < steps.length; i++) {
      const problem = problemOn(i);
      if (problem) {
        goTo(i);
        return setError(problem);
      }
    }
    // A fresh plan (or a new start date) starts fresh progress; earned badges stay.
    // Food logs aren't tied to the plan, so they stay too.
    const fresh = !saved || saved.startDate !== profile.startDate;
    if (fresh) saveProgress({ ...emptyProgress, badges: progress.badges ?? {}, meals: progress.meals ?? {}, customFoods: progress.customFoods ?? {} });
    // Fresh plans always start with a workout on day 1 (see plan.js → extraFirstDay).
    const next = fresh ? { ...profile, firstDayWorkout: true } : profile;
    // On their own routine, the answers only change the week if they switch back to the recommended plan.
    saveProfile(onRoutine && useRecommended ? { ...next, planMode: undefined } : next);
    // A brand-new plan: the plan page offers to save it to an account (SavePlan).
    navigate('/plan', { state: { justBuilt: !saved } });
  };

  // Enter or "Next" moves on a step; the last step builds the plan.
  const handleSubmit = (e) => {
    e.preventDefault();
    const problem = problemOn(step);
    if (problem) return setError(problem);
    if (step < steps.length - 1) goTo(step + 1);
    else finish();
  };

  const startOver = async () => {
    if (!window.confirm('Delete your plan and progress and start again?')) return;
    await clearPlan();
    setProfile(emptyProfile());
    setStep(0);
    setEditing(true);
  };

  if (saved && !editing) {
    const day = todayIndex(saved) + 1;
    return (
      <div className="card profile-summary">
        <h3>Welcome back, {saved.name}.</h3>
        <p className="muted">
          {day < 1 ? `Your plan starts on ${saved.startDate}.` : day > totalDays(saved) ? 'You finished your plan. Time to set a new target.' : `You're on day ${day} of ${totalDays(saved)}.`}
        </p>
        <div className="form-actions">
          <Link to="/plan" className="btn">Go to my plan</Link>
          <button type="button" className="btn btn-ghost" onClick={() => setEditing(true)}>Edit details</button>
          <button type="button" className="btn btn-ghost" onClick={startOver}>Start over</button>
        </div>
      </div>
    );
  }

  const last = step === steps.length - 1;
  return (
    <form ref={formRef} className="card reg-form reg-steps" onSubmit={handleSubmit}>
      <div className="reg-progress">
        <span className="muted small">Step {step + 1} of {steps.length} · {steps[step].title}</span>
        <div className="progress-bar" role="progressbar" aria-label="Plan builder progress" aria-valuenow={step + 1} aria-valuemin="1" aria-valuemax={steps.length}>
          <div style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
      </div>

      {onRoutine && (
        <div className="routine-notice">
          <p>
            <strong>You're following your own routine.</strong> Your week comes from the routine you built, so changes here
            (how and when you train, your level) won't change your workouts unless you switch to the recommended plan.
          </p>
          <label className="routine-switch">
            <input type="checkbox" checked={useRecommended} onChange={(e) => setUseRecommended(e.target.checked)} />
            <span>Use the recommended plan with my new answers. My own routine stays saved, and I can switch back any time.</span>
          </label>
        </div>
      )}

      {at === 'about' && (
      <fieldset>
        <legend>About you</legend>
        <div className="field-grid">
          <label>Name<input required value={profile.name} onChange={update('name')} /></label>
          {/* Three short numbers side by side, so the whole step fits on a phone screen. */}
          <div className="field-row-3">
            <label>Age<input required type="number" inputMode="numeric" min="13" max="100" value={profile.age} onChange={update('age')} /></label>
            <label>Weight (kg)<input required type="number" inputMode="decimal" min="30" max="300" step="0.1" value={profile.weight} onChange={update('weight')} /></label>
            <label>Height (cm)<input required type="number" inputMode="numeric" min="120" max="230" value={profile.height} onChange={update('height')} /></label>
          </div>
          <label>Gender
            <select required value={profile.gender} onChange={update('gender')}>
              <option value="">Select…</option>
              <option>Male</option>
              <option>Female</option>
              <option>Prefer not to say</option>
            </select>
          </label>
        </div>
      </fieldset>
      )}

      {at === 'goals' && (
      <fieldset>
        <legend>How fit are you right now?</legend>
        <div className="levels">
          {levels.map((l) => (
            <label key={l.value} className={`level ${profile.level === l.value ? 'active' : ''}`}>
              <input type="radio" name="level" value={l.value} checked={profile.level === l.value} onChange={update('level')} />
              <strong>{l.value}</strong>
              <span>{l.hint}</span>
            </label>
          ))}
        </div>
        <h4 className="reg-sub">What are your goals?</h4>
        <p className="muted small form-hint">Pick as many as you like.</p>
        <Chips options={registration.goals} selected={profile.goals} onToggle={toggle('goals')} />
        {profile.goals.includes(RUN_GOAL) && (
          <div className="run-level">
            <p className="muted small form-hint">How much do you run now? Your runs go on your rest days and build up every 3 weeks.</p>
            <div className="levels">
              {Object.entries(runLevels).map(([value, l]) => (
                <label key={value} className={`level ${profile.runLevel === value ? 'active' : ''}`}>
                  <input type="radio" name="runLevel" value={value} checked={profile.runLevel === value} onChange={update('runLevel')} />
                  <strong>{value}</strong>
                  <span>{l.hint}. Goal: {l.target}.</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </fieldset>
      )}

      {at === 'how' && (
      <fieldset>
        <legend>How do you want to train?</legend>
        <div className="chips">
          {registration.lookingFor.map((o) => (
            <button type="button" key={o} className={`chip ${profile.lookingFor === o ? 'active' : ''}`} aria-pressed={profile.lookingFor === o} onClick={() => setProfile({ ...profile, lookingFor: o })}>
              {o}
            </button>
          ))}
        </div>
      </fieldset>
      )}

      {at === 'days' && (
      <fieldset>
        <legend>How many days a week?</legend>
        <div className="field-grid">
          <label>Training days
            <select value={profile.schedule} onChange={update('schedule')}>
              {registration.schedules.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
        </div>
        {profile.lookingFor === 'Home workout' && ['2 days a week', '3 days a week'].includes(profile.schedule) && (
          <p className="muted small form-hint">Tip: the home split is built for 4–5 days a week. With fewer days, your plan rotates through the sessions more slowly.</p>
        )}
        {profile.lookingFor === 'Gym work' && <SplitChoice profile={profile} onPick={(gymStyle) => setProfile({ ...profile, gymStyle })} />}
        {!saved && <p className="muted small form-hint">Your plan starts today with a workout, runs for 3 months, and you can change any of this later.</p>}
      </fieldset>
      )}

      {at === 'more' && (
      <fieldset>
        <legend>More details</legend>
        <div className="field-grid">
          <label>Timeline
            <select value={profile.timeline} onChange={update('timeline')}>
              {registration.timelines.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label>Workout time<input type="time" required value={profile.workoutTime} onChange={update('workoutTime')} /></label>
          <label>Start date<input type="date" required value={profile.startDate} onChange={update('startDate')} /></label>
        </div>
        <h4 className="reg-sub">What might get in your way?</h4>
        <p className="muted small form-hint">Optional. Your plan adds tips for whatever you pick.</p>
        <Chips options={Object.keys(challenges)} selected={profile.challenges} onToggle={toggle('challenges')} />
        <textarea
          rows="2"
          placeholder="Anything else? (optional)"
          value={profile.challengesNote}
          onChange={update('challengesNote')}
        />
      </fieldset>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        {step > 0 && <button type="button" className="btn btn-ghost" onClick={() => goTo(step - 1)}>← Back</button>}
        <button type="submit" className="btn">{last ? (saved ? 'Update my plan' : 'Build my plan') : 'Next →'}</button>
        {saved && !last && <button type="button" className="btn btn-ghost" onClick={finish}>Save changes</button>}
        {saved && <button type="button" className="link-btn" onClick={() => setEditing(false)}>Cancel</button>}
      </div>
      <p className="muted small">Your answers are used only to build your plan. <Link to="/privacy">How we handle your data</Link>.</p>
    </form>
  );
}

export default Registration;
