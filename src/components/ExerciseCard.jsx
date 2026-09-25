import { exercises } from '../data/workouts';
import { exerciseMeta, levelName } from '../data/exerciseMeta';
import { doseFor } from '../lib/plan';

function ExerciseCard({ id, index }) {
  const ex = exercises[id];
  const meta = exerciseMeta[id];
  const { dose } = doseFor(id);

  return (
    <div className="exercise ex-card">
      <div className="ex-head">
        {index !== undefined && <span className="ex-num">{index + 1}</span>}
        <h5>{ex.name}</h5>
        <span className={`level-tag l${meta.level}`}>{levelName[meta.level]}</span>
      </div>
      <p>{ex.cue}</p>
      <p className="dose">Start: {dose}</p>
      <div className="ex-tags">
        {meta.muscles.map((m) => <span key={m} className="tag">{m}</span>)}
        <span className="tag tag-equip">{meta.equipment}</span>
      </div>
    </div>
  );
}

export default ExerciseCard;
