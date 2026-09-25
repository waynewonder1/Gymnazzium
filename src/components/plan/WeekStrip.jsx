// statusOf(i) → { type: 'train' | 'rest', rel: 'past' | 'today' | 'future', state?: 'done' | 'missed' | 'todo', title }
function WeekStrip({ week, totalDays, selected, onSelect, onWeek, statusOf, dateOf }) {
  const first = week * 7;
  const days = Array.from({ length: 7 }, (_, k) => first + k).filter((i) => i < totalDays);
  const lastWeek = Math.ceil(totalDays / 7) - 1;

  return (
    <div className="week">
      <div className="week-head">
        <button className="icon-btn" onClick={() => onWeek(week - 1)} disabled={week === 0} aria-label="Previous week">←</button>
        <strong>Week {week + 1} <span className="muted">of {lastWeek + 1}</span></strong>
        <button className="icon-btn" onClick={() => onWeek(week + 1)} disabled={week === lastWeek} aria-label="Next week">→</button>
      </div>
      <div className="week-days">
        {days.map((i) => {
          const s = statusOf(i);
          const date = dateOf(i);
          return (
            <button
              key={i}
              className={`wday ${s.type} ${s.state ?? ''} ${s.rel === 'today' ? 'today' : ''} ${i === selected ? 'selected' : ''}`}
              onClick={() => onSelect(i)}
            >
              <span className="wday-name">{date.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
              <span className="wday-date">{date.getDate()}</span>
              <span className="wday-title">{s.type === 'rest' ? 'Rest' : s.title.replace(' day', '')}</span>
              <span className="wday-dot" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default WeekStrip;
