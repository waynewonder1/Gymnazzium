import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { exerciseMeta, levelName } from '../data/exerciseMeta';
import { exerciseMedia } from '../data/exerciseMedia';
import ExerciseMedia from './ExerciseMedia';

// "How to" button for an exercise in the plan: opens the form tips, plus photos or a clip if we have them.
function ExerciseHowTo({ id, name, cue }) {
  const dialog = useRef(null);
  const meta = exerciseMeta[id];
  const close = () => dialog.current?.close();
  // No photos of this move yet: point to a video search instead.
  const search = `https://www.youtube.com/results?search_query=${encodeURIComponent(`how to do ${name.replace(/\s*\(.*\)/, '')} proper form`)}`;

  // The button sits inside the exercise's tick-box label: preventDefault stops the tap ticking it,
  // and the dialog is rendered outside the label (portal) so taps inside it can't tick it either.
  const openIt = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dialog.current?.showModal();
  };

  return (
    <>
      <button type="button" className="howto-btn" onClick={openIt} aria-label={`How to do ${name}`}>
        {exerciseMedia[id] ? '📷 How to' : 'How to'}
      </button>
      {createPortal(
      <dialog ref={dialog} className="feedback-dialog howto-dialog" aria-labelledby={`howto-${id}`} onClick={(e) => e.target === dialog.current && close()}>
        <div className="feedback-body">
          <h3 id={`howto-${id}`}>{name}</h3>
          <ExerciseMedia id={id} name={name} compact />
          <p>{cue}</p>
          {meta && (
            <div className="ex-tags">
              <span className={`level-tag l${meta.level}`}>{levelName[meta.level]}</span>
              {meta.muscles.map((m) => <span key={m} className="tag">{m}</span>)}
              <span className="tag tag-equip">{meta.equipment}</span>
            </div>
          )}
          {!exerciseMedia[id] && (
            <p className="muted small">
              No photos of this one yet. <a href={search} target="_blank" rel="noreferrer">Watch how on YouTube ↗</a>
            </p>
          )}
          <button type="button" className="btn btn-sm" onClick={close}>Got it</button>
        </div>
      </dialog>,
      document.body)}
    </>
  );
}

export default ExerciseHowTo;
