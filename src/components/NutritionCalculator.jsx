import { useState } from 'react';
import { useMember } from '../context/member';
import { nutrition } from '../lib/plan';
import { registration } from '../data/guide';

const bmiCategory = (bmi) =>
  bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy range' : bmi < 30 ? 'Overweight' : 'Obese range';

function NutritionCalculator() {
  const { profile } = useMember();
  const [form, setForm] = useState({
    weight: profile?.weight ?? '',
    height: profile?.height ?? '',
    age: profile?.age ?? '',
    gender: profile?.gender ?? 'Male',
    schedule: profile?.schedule ?? '3 days a week',
    goal: profile?.goals?.[0] ?? 'Lose fat',
  });
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const ready = form.weight > 0 && form.height > 0 && form.age > 0;
  const n = ready ? nutrition({ ...form, goals: [form.goal] }) : null;

  return (
    <div className="calc card flat">
      <div className="calc-inputs reg-form">
        <label>Weight (kg)<input type="number" min="30" max="300" value={form.weight} onChange={update('weight')} /></label>
        <label>Height (cm)<input type="number" min="120" max="230" value={form.height} onChange={update('height')} /></label>
        <label>Age<input type="number" min="13" max="100" value={form.age} onChange={update('age')} /></label>
        <label>Gender
          <select value={form.gender} onChange={update('gender')}>
            <option>Male</option>
            <option>Female</option>
            <option>Prefer not to say</option>
          </select>
        </label>
        <label>Training
          <select value={form.schedule} onChange={update('schedule')}>
            {registration.schedules.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label>Goal
          <select value={form.goal} onChange={update('goal')}>
            {registration.goals.map((g) => <option key={g}>{g}</option>)}
          </select>
        </label>
      </div>

      {n ? (
        <div className="calc-results">
          <div className="stat"><span className="stat-label">Eat</span><strong className="stat-value">{n.target.toLocaleString()} kcal</strong><span className="stat-note">a day (maintenance ≈ {n.maintenance.toLocaleString()})</span></div>
          <div className="stat"><span className="stat-label">Protein</span><strong className="stat-value">{n.protein} g</strong><span className="stat-note">a day, in 3–4 meals</span></div>
          <div className="stat"><span className="stat-label">Water</span><strong className="stat-value">{n.water} L</strong><span className="stat-note">a day, more when hot</span></div>
          <div className="stat"><span className="stat-label">BMI</span><strong className="stat-value">{n.bmi}</strong><span className="stat-note">{bmiCategory(n.bmi)} (a rough guide only)</span></div>
        </div>
      ) : (
        <p className="muted calc-empty">Enter your weight, height and age to see your numbers.</p>
      )}
      <p className="muted small">Estimates from the Mifflin–St Jeor equation, the most reliable of the common formulas, usually within 10% of measured values.</p>
    </div>
  );
}

export default NutritionCalculator;
