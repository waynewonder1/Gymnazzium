import { FOOD_GOALS } from '../../data/meals';

// "What's your goal?" — sets profile.foodGoal, which sets the daily calorie target.
function FoodGoalPicker({ current, onPick, compact = false }) {
  return (
    <div className={`food-goal${compact ? ' compact' : ''}`}>
      <p className="food-goal-q"><strong>What's your goal?</strong>{!compact && <span className="muted small"> Your daily calories follow it. You can change it any time.</span>}</p>
      <div className="levels">
        {Object.entries(FOOD_GOALS).map(([key, g]) => (
          <button type="button" key={key} className={`level ${current === key ? 'active' : ''}`} aria-pressed={current === key} onClick={() => onPick(key)}>
            <strong>{g.icon} {g.label}</strong>
            {!compact && <span>{g.text}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default FoodGoalPicker;
