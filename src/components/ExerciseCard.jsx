import { exercises } from '../data/workouts';
import { exerciseMeta, levelName } from '../data/exerciseMeta';
import { doseFor } from '../lib/plan';
import ExerciseMedia from './ExerciseMedia';

// folded: a short row (name, level, muscles) that opens to the photo, cue and dose. Used on phones.
function ExerciseCard({ id, index, folded = false }) {
  const ex = exercises[id];
  const meta = exerciseMeta[id];
  const { dose } = doseFor(id);

  const head = (
    <div className="ex-head">
      {index !== undefined && <span className="ex-num">{index + 1}</span>}
      <h5>{ex.name}</h5>
      <span className={`level-tag l${meta.level}`}>{levelName[meta.level]}</span>
    </div>
  );
  const tags = (
    <div className="ex-tags">
      {meta.muscles.map((m) => <span key={m} className="tag">{m}</span>)}
      <span className="tag tag-equip">{meta.equipment}</span>
    </div>
  );

  if (folded) {
    // Closed <details>: the photo inside isn't downloaded until it's opened.
    return (
      <details className="exercise ex-card ex-fold">
        <summary>
          {head}
          {tags}
        </summary>
        <ExerciseMedia id={id} name={ex.name} />
        <p>{ex.cue}</p>
        <p className="dose">Start: {dose}</p>
      </details>
    );
  }

  return (
    <div className="exercise ex-card">
      <ExerciseMedia id={id} name={ex.name} />
      {head}
      <p>{ex.cue}</p>
      <p className="dose">Start: {dose}</p>
      {tags}
    </div>
  );
}

export default ExerciseCard;
