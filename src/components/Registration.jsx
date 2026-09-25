import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { registration } from '../data/guide';
import { challenges } from '../data/coaching';
import { useMember } from '../context/member';
import { emptyProgress } from '../lib/storage';
import { toISO, todayIndex, totalDays } from '../lib/plan';

const levels = [
  { value: 'Beginner', hint: "Can't do 10 clean push-ups yet" },
  { value: 'Intermediate', hint: 'Train on and off, know the basics' },
  { value: 'Advanced', hint: 'Train consistently for a year or more' },
];

const emptyProfile = () => ({
  name: '',
  weight: '',
  height: '',
  age: '',
  gender: '',
  level: 'Beginner',
  goals: [],
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
  const { profile: saved, saveProfile, saveProgress, clearPlan } = useMember();
  // Pages like /paths/home-workout link here with some answers already picked.
  const prefill = location.state?.prefill ?? {};
  const [profile, setProfile] = useState(() => ({ ...emptyProfile(), ...saved, ...prefill }));
  const [editing, setEditing] = useState(() => !saved || location.state?.edit === true || Boolean(location.state?.prefill));
  const [error, setError] = useState('');

  const update = (field) => (e) => setProfile({ ...profile, [field]: e.target.value });
  const toggle = (field) => (value) =>
    setProfile({
      ...profile,
      [field]: profile[field].includes(value) ? profile[field].filter((v) => v !== value) : [...profile[field], value],
    });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (profile.goals.length === 0) return setError('Pick at least one goal.');
    if (!profile.lookingFor) return setError('Pick how you want to train.');
    // A fresh plan (or a new start date) starts fresh progress.
    if (!saved || saved.startDate !== profile.startDate) saveProgress(emptyProgress);
    saveProfile(profile);
    navigate('/plan');
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

  return (
    <form className="card reg-form" onSubmit={handleSubmit}>
      <fieldset>
        <legend>1. About you</legend>
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

      <fieldset>
        <legend>2. What are your goals?</legend>
        <Chips options={registration.goals} selected={profile.goals} onToggle={toggle('goals')} />
      </fieldset>

      <fieldset>
        <legend>3. How do you want to train?</legend>
        <div className="chips">
          {registration.lookingFor.map((o) => (
            <button type="button" key={o} className={`chip ${profile.lookingFor === o ? 'active' : ''}`} aria-pressed={profile.lookingFor === o} onClick={() => setProfile({ ...profile, lookingFor: o })}>
              {o}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>4–5. Timeline & schedule</legend>
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
        {profile.lookingFor === 'Gym work' && ['2 days a week', '3 days a week'].includes(profile.schedule) && (
          <p className="muted small form-hint">Tip: the gym split is built for 4–5 days a week. With fewer days, your plan rotates through the sessions more slowly.</p>
        )}
      </fieldset>

      <fieldset>
        <legend>6. What might get in your way?</legend>
        <Chips options={Object.keys(challenges)} selected={profile.challenges} onToggle={toggle('challenges')} />
        <textarea
          rows="2"
          placeholder="Anything else? (optional)"
          value={profile.challengesNote}
          onChange={update('challengesNote')}
        />
      </fieldset>

      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        <button type="submit" className="btn">{saved ? 'Update my plan' : 'Build my plan'}</button>
        {saved && <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>}
      </div>
    </form>
  );
}

export default Registration;
