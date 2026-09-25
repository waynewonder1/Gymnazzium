import { goalDetails } from '../../data/coaching';
import { guide } from '../../data/guide';
import { expectations, nutrition } from '../../lib/plan';
import Guide from '../Guide';
import CalorieDeficit from '../CalorieDeficit';

function DeepDive({ profile }) {
  const n = nutrition(profile);
  const details = profile.goals.map((g) => ({ goal: g, ...goalDetails[g] })).filter((d) => d.headline);
  const topicIds = guide.map((t) => t.id).filter((id) => details.some((d) => d.topics.includes(id)));
  const showDeficit = details.some((d) => d.showDeficit);

  const calorieNote =
    n.adjustment < 0
      ? `About ${Math.abs(n.target - n.maintenance)} kcal below maintenance, for steady fat loss without starving.`
      : n.adjustment > 0
        ? `About ${n.target - n.maintenance} kcal above maintenance, to fuel muscle growth.`
        : 'Maintenance: enough to fuel training without gaining fat.';

  return (
    <>
      <h3 className="sub-title">What's realistic in {profile.timeline}</h3>
      <div className="stat-grid">
        {expectations(profile).map((e) => (
          <div className="stat" key={e.label}>
            <span className="stat-label">{e.label}</span>
            <strong className="stat-value">{e.value}</strong>
            <span className="stat-note">{e.note}</span>
          </div>
        ))}
      </div>
      <p className="muted small">These are estimates, not promises. Sleep, diet, stress and genetics all move them.</p>

      <h3 className="sub-title">Your numbers</h3>
      <div className="stat-grid">
        <div className="stat"><span className="stat-label">Daily calories</span><strong className="stat-value">{n.target.toLocaleString()} kcal</strong><span className="stat-note">{calorieNote}</span></div>
        <div className="stat"><span className="stat-label">Protein</span><strong className="stat-value">{n.protein} g / day</strong><span className="stat-note">Split across 3–4 meals.</span></div>
        <div className="stat"><span className="stat-label">Water</span><strong className="stat-value">{n.water} L / day</strong><span className="stat-note">More on hot days and training days.</span></div>
        <div className="stat"><span className="stat-label">BMI</span><strong className="stat-value">{n.bmi}</strong><span className="stat-note">A rough guide only. It can't tell muscle from fat.</span></div>
      </div>
      <p className="muted small">Estimated with the Mifflin–St Jeor formula from your age, height, weight and training days.</p>

      {details.map((d) => (
        <div className="goal-block" key={d.goal}>
          <span className="section-label">{d.goal}</span>
          <h3>{d.headline}</h3>
          <ul>
            {d.points.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
      ))}

      {showDeficit && (
        <>
          <h3 className="sub-title">How a calorie deficit works</h3>
          <CalorieDeficit />
        </>
      )}

      {topicIds.length > 0 && (
        <>
          <h3 className="sub-title">Your training guide</h3>
          <Guide topicIds={topicIds} />
        </>
      )}
    </>
  );
}

export default DeepDive;
