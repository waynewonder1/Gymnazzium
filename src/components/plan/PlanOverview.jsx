// The whole plan at a glance: one row per week, one cell per day.
function PlanOverview({ totalDays, selected, onSelect, statusOf }) {
  const weeks = Math.ceil(totalDays / 7);

  return (
    <details className="overview">
      <summary>See the whole plan ({weeks} weeks)</summary>
      <div className="legend">
        <span><i className="cell train done" /> Done</span>
        <span><i className="cell train missed" /> Missed</span>
        <span><i className="cell train todo" /> Workout</span>
        <span><i className="cell rest" /> Rest</span>
      </div>
      <div className="overview-grid">
        {Array.from({ length: weeks }, (_, w) => (
          <div className="overview-row" key={w}>
            <span className="overview-label">W{w + 1}</span>
            {Array.from({ length: 7 }, (_, k) => w * 7 + k)
              .filter((i) => i < totalDays)
              .map((i) => {
                const s = statusOf(i);
                return (
                  <button
                    key={i}
                    className={`cell ${s.type} ${s.state ?? ''} ${s.rel === 'today' ? 'today' : ''} ${i === selected ? 'selected' : ''}`}
                    title={`Day ${i + 1}: ${s.title}`}
                    aria-label={`Day ${i + 1}: ${s.title}`}
                    onClick={() => onSelect(i)}
                  />
                );
              })}
            {w % 3 === 0 && <span className="overview-phase">Phase {w / 3 + 1}</span>}
          </div>
        ))}
      </div>
    </details>
  );
}

export default PlanOverview;
