import { calorieDeficit } from '../data/guide';

function CalorieDeficit() {
  const { text, burn, foods, takeaway } = calorieDeficit;
  const scale = Math.max(burn.max, ...foods.map((f) => f.kcal));

  return (
    <div className="deficit">
      <div className="deficit-text">
        {text.map((p) => <p key={p}>{p}</p>)}
      </div>

      <div className="card deficit-chart">
        <h3>Fries vs. mash</h3>
        {foods.map((food) => (
          <div className="bar-row" key={food.name}>
            <div className="bar-label"><span>{food.name}</span><span>{food.note}</span></div>
            <div className="bar-track">
              <div className="bar food" style={{ width: `${(food.kcal / scale) * 100}%` }} />
            </div>
          </div>
        ))}
        <div className="bar-row">
          <div className="bar-label"><span>{burn.label}</span><span>{burn.min}–{burn.max} kcal burned</span></div>
          <div className="bar-track">
            <div
              className="bar burn"
              style={{ marginLeft: `${(burn.min / scale) * 100}%`, width: `${((burn.max - burn.min) / scale) * 100}%` }}
            />
          </div>
        </div>
        <p className="takeaway">{takeaway}</p>
      </div>
    </div>
  );
}

export default CalorieDeficit;
