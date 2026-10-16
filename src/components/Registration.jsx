import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { registration } from '../data/guide';
import { challenges } from '../data/coaching';
import { RUN_GOAL, runLevels } from '../data/workouts';
import { useMember } from '../context/member';
import { emptyProgress } from '../lib/storage';
import { toISO, todayIndex, totalDays } from '../lib/plan';

const levels = [
  { value: 'Beginner', hint: "Can't do 10 clean push-ups yet" },
  { value: 'Intermediate', hint: 'Train on and off, know the basics' },
  { value: 'Advanced', hint: 'Train consistently for a year or more' },
];

const STEPS = ['About you', 'Your level', 'Your goals', 'How you train', 'When you train', 'What might get in your way'];

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
});

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
  const [profile, setProfile] = useState(() => ({ ...emptyProfile(), ...saved, ...prefill }));
  const [editing, setEditing] = useState(() => !saved || location.state?.edit === true || Boolean(location.state?.prefill));
  const [step, setStep] = useState(0);
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
    if (i === 0 && !(profile.name.trim() && profile.age && profile.weight && profile.height && profile.gender)) return 'Fill in all the boxes about you.';
    if (i === 2 && profile.goals.length === 0) return 'Pick at least one goal.';
    if (i === 2 && profile.goals.includes(RUN_GOAL) && !runLevels[profile.runLevel]) return 'Pick how much you run now, so we can set your distance.';
    if (i === 3 && !profile.lookingFor) return 'Pick how you want to train.';
    if (i === 4 && !(profile.workoutTime && profile.startDate)) return 'Pick a workout time and a start date.';
    return '';
  };

  const goTo = (i) => {
    setError('');
    setStep(i);
    formRef.current?.scrollIntoView({ block: 'start' });
  };

  const finish = () => {
    // Check every step; jump to the first one that needs attention.
    for (let i = 0; i < STEPS.length; i++) {
      const problem = problemOn(i);
      if (problem) {
        goTo(i);
        return setError(problem);
      }
    }
    // A fresh plan (or a new start date) starts fresh progress; earned badges stay.
    if (!saved || saved.startDate !== profile.startDate) saveProgress({ ...emptyProgress, badges: progress.badges ?? {} });
    saveProfile(profile);
    navigate('/plan');
  };

  // Enter or "Next" moves on a step; the last step builds the plan.
  const handleSubmit = (e) => {
    e.preventDefault();
    const problem = problemOn(step);
    if (problem) return setError(problem);
    if (step < STEPS.length - 1) goTo(step + 1);
    else finish();
  };

  const startOver = async () => {
    if (!window.confirm('Delete your plan and progress and start again?')) return;
    await clearPlan();
    setProfile(emptyProfile());
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

  const last = step === STEPS.length - 1;
  return (
    <form ref={formRef} className="card reg-form reg-steps" onSubmit={handleSubmit}>
      <div className="reg-progress">
        <span className="muted small">Step {step + 1} of {STEPS.length} · {STEPS[step]}</span>
        <div className="progress-bar" role="progressbar" aria-label="Plan builder progress" aria-valuenow={step + 1} aria-valuemin="1" aria-valuemax={STEPS.length}>
          <div style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      {step === 0 && (
      <fieldset>
        <legend>About you</legend>
        <div className="field-grid">
          <label>Name<input required value={profile.name} onChange={update('name')} /></label>
          <label>Age<input required type="number" min="13" max="100" value={profile.age} onChange={update('age')} /></label>
          <label>Weight (kg)<input required type="number" min="30" max="300" step="0.1" value={profile.weight} onChange={update('weight')} /></label>
          <label>Height (cm)<input required type="number" min="120" max="230" value={profile.height} onChange={update('height')} /></label>
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

      {step === 1 && (
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
      </fieldset>
      )}

      {step === 2 && (
      <fieldset>
        <legend>What are your goals?</legend>
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

      {step === 3 && (
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

      {step === 4 && (
      <fieldset>
        <legend>When will you train?</legend>
        <div className="field-grid">
          <label>Timeline
            <select value={profile.timeline} onChange={update('timeline')}>
              {registration.timelines.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label>Training days
            <select value={profile.schedule} onChange={update('schedule')}>
              {registration.schedules.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label>Workout time<input type="time" required value={profile.workoutTime} onChange={update('workoutTime')} /></label>
          <label>Start date<input type="date" required value={profile.startDate} onChange={update('startDate')} /></label>
        </div>
        {['Gym work', 'Home workout'].includes(profile.lookingFor) && ['2 days a week', '3 days a week'].includes(profile.schedule) && (
          <p className="muted small form-hint">Tip: the {profile.lookingFor === 'Gym work' ? 'gym' : 'home'} split is built for 4–5 days a week. With fewer days, your plan rotates through the sessions more slowly.</p>
        )}
      </fieldset>
      )}

      {step === 5 && (
      <fieldset>
        <legend>What might get in your way?</legend>
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
