import { gymStyleFor, gymStyleOptions, gymStyles, recommendedGymStyle } from '../../data/workouts';

// Gym plans: show the split being followed, and let the member switch to another that fits their days.
function SplitPicker({ profile, onPick }) {
  const current = gymStyleFor(profile);
  const best = recommendedGymStyle(profile.schedule, profile.level);
  const options = gymStyleOptions(profile.schedule, profile.level);

  const pick = (key) => {
    if (key === current) return;
    if (!window.confirm(`Switch to ${gymStyles[key].name}? Your workouts follow the new split from now on. Workouts you've done still count.`)) return;
    onPick(key);
  };

  return (
    <details className="split-picker">
      <summary>
        <span>
          Your split: <strong>{gymStyles[current].name}</strong>
          {current !== best && <span className="muted small"> · {gymStyles[best].name} is recommended for {profile.schedule.replace(' a week', '')} a week</span>}
        </span>
        <span className="link-btn">Change</span>
      </summary>
      <div className="levels">
        {options.map((key) => (
          <button type="button" key={key} className={`level ${current === key ? 'active' : ''}`} aria-pressed={current === key} onClick={() => pick(key)}>
            <strong>{gymStyles[key].name}{key === best && <span className="tag rec-tag">Recommended</span>}</strong>
            <span>{gymStyles[key].text}</span>
          </button>
        ))}
      </div>
      <p className="muted small">Training a different number of days? <span>Change it with “Edit my details” at the bottom of this page.</span></p>
    </details>
  );
}

export default SplitPicker;
