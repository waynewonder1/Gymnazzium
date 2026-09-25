import { useState } from 'react';

const KEY = 'gymnazzium-ladders';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}

// Tap a rung to mark it (and every rung below it) as unlocked. Saved on this device.
function SkillLadder({ tracks }) {
  const [reached, setReached] = useState(load); // { [trackName]: highest unlocked index }

  const set = (track, index) => {
    const next = { ...reached, [track]: reached[track] === index ? index - 1 : index };
    setReached(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  return (
    <div className="ladders">
      {tracks.map((t) => {
        const top = reached[t.name] ?? -1;
        return (
          <div className="ladder" key={t.name}>
            <div className="ladder-head">
              <strong>{t.name}</strong>
              <span className="muted small">{top + 1}/{t.steps.length}</span>
            </div>
            <div className="ladder-steps">
              {t.steps.map((step, i) => (
                <button
                  type="button"
                  key={step}
                  className={`rung ${i <= top ? 'done' : ''} ${i === top + 1 ? 'next' : ''}`}
                  aria-pressed={i <= top}
                  onClick={() => set(t.name, i)}
                >
                  <span className="rung-num">{i + 1}</span>
                  {step}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SkillLadder;
