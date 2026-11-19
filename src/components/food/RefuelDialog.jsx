import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FOOD_GOALS } from '../../data/meals';
import { addFoods, dayKey, mealTotals, refuelIdeas } from '../../lib/food';
import { nutrition } from '../../lib/plan';
import FoodGoalPicker from './FoodGoalPicker';

// After a workout: three meal ideas for the member's goal and the time of day; one tap logs one.
function RefuelDialog({ open, onClose, profile, progress, saveProfile, saveProgress }) {
  const dialog = useRef(null);
  const [logged, setLogged] = useState(null);

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
  }, [open]);

  const close = () => {
    dialog.current?.close();
    setLogged(null);
    onClose();
  };

  const goal = profile.foodGoal;
  const ideas = refuelIdeas(goal ?? 'maintain');
  const { protein } = nutrition(profile);
  const ate = (meal) => {
    saveProgress(addFoods(progress, dayKey(), meal.items));
    setLogged(meal.name);
  };

  return (
    <dialog ref={dialog} className="feedback-dialog refuel-dialog" aria-labelledby="refuel-title" onCancel={(e) => { e.preventDefault(); close(); }}>
      <div className="feedback-body">
        <h3 id="refuel-title">Great work! 💪 Time to refuel</h3>
        <p className="muted small">
          Eat a proper meal in the next 1–2 hours, with some protein: you need about {protein} g of protein across the day.
          {goal && <> Ideas for your goal: <strong>{FOOD_GOALS[goal].label.toLowerCase()}</strong>.</>}
        </p>
        {!goal && <FoodGoalPicker compact onPick={(foodGoal) => saveProfile({ ...profile, foodGoal })} />}
        <ul className="refuel-ideas">
          {ideas.map((meal) => {
            const t = mealTotals(meal);
            return (
              <li key={meal.name}>
                <span>
                  <strong>{meal.name}</strong>
                  <span className="muted small"> ~{t.kcal} kcal · {Math.round(t.p)} g protein</span>
                </span>
                {logged === meal.name ? (
                  <span className="refuel-done">Logged ✓</span>
                ) : (
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => ate(meal)}>I ate this</button>
                )}
              </li>
            );
          })}
        </ul>
        <div className="form-actions">
          <Link to="/food" className="btn btn-sm" onClick={close}>Open my food log</Link>
          <button type="button" className="link-btn" onClick={close}>Not now</button>
        </div>
      </div>
    </dialog>
  );
}

export default RefuelDialog;
