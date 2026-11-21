import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMember } from '../context/member';
import { FOOD_CATEGORIES, PORTIONS, foods } from '../data/foods';
import { FOOD_GOALS } from '../data/meals';
import { addCustomFood, addFoods, addGrams, dayKey, foodInfo, recentFoods, removeEntry, totals } from '../lib/food';
import { addDays, nutrition } from '../lib/plan';
import FoodGoalPicker from '../components/food/FoodGoalPicker';

const qtyLabel = (q) => (q === 0.5 ? '½' : q === 1.5 ? '1½' : String(q));

// The food tracker: today's calories and protein against the member's targets, quick logging
// from a list of everyday foods (or their own), and the goal question (gain / maintain / lose).
function Food() {
  const { profile, progress, saveProfile, saveProgress, authReady, syncing } = useMember();
  const [offset, setOffset] = useState(0); // 0 = today, -1 = yesterday …
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('Recent');
  const [picking, setPicking] = useState(null); // food id waiting for a portion
  const [size, setSize] = useState(0); // which portion size of that food
  const [grams, setGrams] = useState('');
  const [custom, setCustom] = useState({ name: '', portion: '', kcal: '', p: '', c: '', f: '' });
  const [changingGoal, setChangingGoal] = useState(false);

  const date = addDays(new Date(), offset);
  const day = dayKey(date);
  const entries = progress.meals?.[day] ?? [];
  const eaten = totals(entries);
  const recent = useMemo(() => recentFoods(progress), [progress]);

  if (!profile) {
    return (
      <section className="page-top">
        {!authReady || syncing ? <p className="muted">Loading…</p> : (
          <>
            <div className="section-label">Food</div>
            <h1 className="page-title">Build your plan first.</h1>
            <p className="page-lead">Your calorie and protein targets come from your plan (weight, height, age and training days).</p>
            <Link to="/plan" className="btn">Build my plan</Link>
          </>
        )}
      </section>
    );
  }

  const targets = nutrition(profile);
  const goal = FOOD_GOALS[profile.foodGoal];
  const pickGoal = (foodGoal) => {
    saveProfile({ ...profile, foodGoal });
    setChangingGoal(false);
  };

  const pick = (id) => {
    setPicking(picking === id ? null : id);
    setSize(0);
    setGrams('');
  };
  const add = (id, qty) => {
    saveProgress(addFoods(progress, day, [[id, qty, size]]));
    setPicking(null);
  };
  const addExact = (e, id) => {
    e.preventDefault();
    if (!(Number(grams) > 0)) return;
    saveProgress(addGrams(progress, day, id, grams));
    setPicking(null);
  };
  const remove = (entryId) => saveProgress(removeEntry(progress, day, entryId));
  const saveCustom = (e) => {
    e.preventDefault();
    if (!custom.name.trim() || !custom.kcal) return;
    const { id, progress: next } = addCustomFood(progress, custom);
    saveProgress(addFoods(next, day, [[id, 1]]));
    setCustom({ name: '', portion: '', kcal: '', p: '', c: '', f: '' });
  };

  // Which foods to list: a search across everything, or one tab.
  const q = query.trim().toLowerCase();
  const myFoods = Object.keys(progress.customFoods ?? {});
  const allIds = [...Object.keys(foods), ...myFoods];
  const tabs = [...(recent.length ? ['Recent'] : []), ...FOOD_CATEGORIES, ...(myFoods.length ? ['My foods'] : [])];
  const activeCat = tabs.includes(cat) ? cat : tabs[0]; // "Recent" is empty until something is logged
  const listed = q
    ? allIds.filter((id) => foodInfo(id, progress).name.toLowerCase().includes(q))
    : activeCat === 'Recent' ? recent : activeCat === 'My foods' ? myFoods : Object.keys(foods).filter((id) => foods[id].cat === activeCat);

  const pct = (n, of) => Math.min(100, Math.round((n / of) * 100));
  const left = targets.target - eaten.kcal;

  return (
    <section className="page-top food-page">
      <div className="section-label">Food</div>
      <h1 className="page-title">Fuel the work.</h1>

      {!goal || changingGoal ? (
        <FoodGoalPicker current={profile.foodGoal} onPick={pickGoal} />
      ) : (
        <p className="food-goal-line muted small">
          {goal.icon} Goal: <strong>{goal.label}</strong> · <button type="button" className="link-btn" onClick={() => setChangingGoal(true)}>Change</button>
        </p>
      )}

      <div className="food-day">
        <button type="button" className="icon-btn" onClick={() => setOffset(offset - 1)} aria-label="Previous day">←</button>
        <strong>{offset === 0 ? 'Today' : offset === -1 ? 'Yesterday' : date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</strong>
        <button type="button" className="icon-btn" onClick={() => setOffset(offset + 1)} disabled={offset >= 0} aria-label="Next day">→</button>
      </div>

      <div className="card food-summary">
        <div className="food-big">
          <strong>{eaten.kcal.toLocaleString()}</strong>
          <span className="muted"> / {targets.target.toLocaleString()} kcal</span>
        </div>
        <div className="progress-bar" role="progressbar" aria-label="Calories eaten" aria-valuenow={pct(eaten.kcal, targets.target)} aria-valuemin="0" aria-valuemax="100">
          <div style={{ width: `${pct(eaten.kcal, targets.target)}%` }} />
        </div>
        <p className="muted small">{left >= 0 ? `${left.toLocaleString()} kcal left` : `${(-left).toLocaleString()} kcal over your target`}</p>
        <div className="food-macros">
          {[
            ['Protein', eaten.p, targets.protein],
            ['Carbs', eaten.c, targets.carbs],
            ['Fat', eaten.f, targets.fat],
          ].map(([label, got, of]) => (
            <div className="food-protein" key={label}>
              <span>{label} <strong>{Math.round(got)} g</strong> / {of} g</span>
              <div className="progress-bar thin" aria-hidden="true"><div style={{ width: `${pct(got, of)}%` }} /></div>
            </div>
          ))}
        </div>
      </div>

      <button type="button" className="btn btn-ghost snap-btn" disabled title="Coming soon">
        📷 Snap my meal <span className="tag">Coming soon</span>
      </button>

      {entries.length > 0 && (
        <ul className="food-log">
          {entries.map((e) => (
            <li key={e.id}>
              <span>
                <strong>{e.name}</strong>
                <span className="muted small"> · {e.label ?? `× ${qtyLabel(e.qty)}`}</span>
              </span>
              <span className="muted small">{e.kcal} kcal · {Math.round(e.p)} g protein</span>
              <button type="button" className="icon-btn" onClick={() => remove(e.id)} aria-label={`Remove ${e.name}`}>✕</button>
            </li>
          ))}
        </ul>
      )}

      <h2 className="food-h2">Add food</h2>
      <input className="food-search" type="search" placeholder="Search: ugali, eggs, chapati…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search foods" />
      {!q && (
        <div className="chips food-tabs">
          {tabs.map((t) => (
            <button type="button" key={t} className={`chip ${activeCat === t ? 'active' : ''}`} aria-pressed={activeCat === t} onClick={() => setCat(t)}>{t}</button>
          ))}
        </div>
      )}
      <ul className="food-list">
        {listed.length === 0 && <li className="muted small">No match. Add it as your own food below.</li>}
        {listed.slice(0, 40).map((id) => {
          const f = foodInfo(id, progress);
          return (
            <li key={id} className={picking === id ? 'open' : ''}>
              <button type="button" className="food-item" onClick={() => pick(id)} aria-expanded={picking === id}>
                <span><strong>{f.name}</strong><span className="muted small"> · {f.portion}</span></span>
                <span className="muted small">{f.kcal} kcal · {f.p} g</span>
              </button>
              {picking === id && (
                <div className="food-portions">
                  {f.per100 && f.portions.length > 1 && (
                    <div className="food-sizes" role="group" aria-label="Portion size">
                      {f.portions.map((pt, i) => (
                        <button type="button" key={pt.label} className={`chip ${size === i ? 'active' : ''}`} aria-pressed={size === i} onClick={() => setSize(i)}>
                          {pt.label} <span className="chip-note">~{pt.g} {f.unit}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="food-qty">
                    <span className="muted small">How many?</span>
                    {PORTIONS.map((qty) => (
                      <button type="button" key={qty} className="chip" onClick={() => add(id, qty)} aria-label={`Log ${qtyLabel(qty)} × ${f.per100 ? f.portions[size].label : f.portion}`}>{qtyLabel(qty)}</button>
                    ))}
                  </div>
                  {f.per100 && (
                    <>
                      <form className="food-grams" onSubmit={(e) => addExact(e, id)}>
                        <label>
                          <span className="muted small">Or exact amount</span>
                          <input type="number" inputMode="decimal" min="1" max="5000" value={grams} onChange={(e) => setGrams(e.target.value)} placeholder={String(f.portions[size].g)} aria-label={`Amount of ${f.name} in ${f.unit}`} />
                          <span className="muted small">{f.unit}</span>
                        </label>
                        <button className="btn btn-sm btn-ghost" disabled={!(Number(grams) > 0)}>Log</button>
                      </form>
                      <p className="muted small food-per100">
                        Per 100 {f.unit}: {f.per100.kcal} kcal · {f.per100.p} g protein · {f.per100.c} g carbs · {f.per100.f} g fat
                      </p>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <details className="food-custom">
        <summary>Not in the list? Add your own food</summary>
        <form onSubmit={saveCustom} className="field-grid">
          <label>Name<input required maxLength={60} value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} placeholder="e.g. Mum's pilau" /></label>
          <label>Portion<input maxLength={40} value={custom.portion} onChange={(e) => setCustom({ ...custom, portion: e.target.value })} placeholder="e.g. 1 plate" /></label>
          <label>Calories (kcal)<input required type="number" min="0" max="5000" value={custom.kcal} onChange={(e) => setCustom({ ...custom, kcal: e.target.value })} /></label>
          <label>Protein (g)<input type="number" min="0" max="300" step="0.5" value={custom.p} onChange={(e) => setCustom({ ...custom, p: e.target.value })} /></label>
          <label>Carbs (g)<input type="number" min="0" max="600" step="0.5" value={custom.c} onChange={(e) => setCustom({ ...custom, c: e.target.value })} /></label>
          <label>Fat (g)<input type="number" min="0" max="300" step="0.5" value={custom.f} onChange={(e) => setCustom({ ...custom, f: e.target.value })} /></label>
          <button className="btn btn-sm">Add and log it</button>
        </form>
      </details>

      <p className="muted small food-note">
        Values are per 100 g of food as eaten (per 100 ml for drinks): estimates that are being checked against the Kenya Food Composition Tables 2018.
        Home cooking varies, especially the oil, so use them as a guide, not an exact count.
        This isn't medical advice: if you have a health condition, check with a doctor before changing how you eat.
      </p>
    </section>
  );
}

export default Food;
