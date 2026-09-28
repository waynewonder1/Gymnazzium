import { useEffect, useState } from 'react';
import { getRestSettings, setRestSettings, subscribeRest } from '../../lib/restTimer';

const OPTIONS = [60, 90, 120];

// "Auto rest: Off · 60 s · 90 s · 2 min" chips.
function RestSettings() {
  const [settings, setSettings] = useState(getRestSettings);
  useEffect(() => subscribeRest(() => setSettings(getRestSettings())), []);

  return (
    <div className="rest-settings">
      <span className="muted small">Auto rest timer after each set:</span>
      <div className="chips">
        <button type="button" className={`chip ${!settings.on ? 'active' : ''}`} aria-pressed={!settings.on} onClick={() => setRestSettings({ ...settings, on: false })}>Off</button>
        {OPTIONS.map((s) => (
          <button
            type="button"
            key={s}
            className={`chip ${settings.on && settings.seconds === s ? 'active' : ''}`}
            aria-pressed={settings.on && settings.seconds === s}
            onClick={() => setRestSettings({ on: true, seconds: s })}
          >
            {s === 120 ? '2 min' : `${s} s`}
          </button>
        ))}
      </div>
    </div>
  );
}

export default RestSettings;
