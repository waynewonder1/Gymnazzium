// Run logging. Logged runs live in progress.runs:
//   { [dayIndex]: { km: number, sec: number (total time) } }

// "3 km · one break max" → 3 (the distance a run day asks for).
export const targetKm = (dose) => Number(String(dose).match(/(\d+(?:\.\d+)?)\s*km/)?.[1]) || null;

// Seconds per km.
export const paceOf = (run) => (run.km > 0 ? run.sec / run.km : null);

// 1110 → "18:30", 3725 → "1:02:05".
export function formatTime(sec) {
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

// 370 → "6:10 /km".
export const formatPace = (secPerKm) => `${formatTime(secPerKm)} /km`;

export const formatRun = (run) => `${run.km} km in ${formatTime(run.sec)} · ${formatPace(paceOf(run))}`;

// Every logged run, oldest first.
export function runHistory(runs) {
  return Object.entries(runs ?? {})
    .map(([index, run]) => ({ index: Number(index), ...run, pace: paceOf(run) }))
    .filter((r) => r.km > 0 && r.sec > 0)
    .sort((a, b) => a.index - b.index);
}

// The run before this day, for "Last run: …".
export const lastRun = (runs, beforeIndex) => runHistory(runs).filter((r) => r.index < beforeIndex).at(-1) ?? null;

// A run is a personal best when it beats every earlier run: the longest distance,
// or else the fastest pace (over at least 1 km). The first run only sets the baseline.
export function runPrFor(runs, index, run = runs?.[index]) {
  if (!run || !(run.km > 0 && run.sec > 0)) return null;
  const earlier = runHistory(runs).filter((r) => r.index < index);
  if (earlier.length === 0) return null;
  if (run.km > Math.max(...earlier.map((r) => r.km))) return { type: 'distance', text: `Longest run ever: ${run.km} km` };
  const paced = earlier.filter((r) => r.km >= 1);
  const pace = paceOf(run);
  if (run.km >= 1 && paced.length > 0 && pace < Math.min(...paced.map((r) => r.pace))) {
    return { type: 'pace', text: `Fastest pace ever: ${formatPace(pace)}` };
  }
  return null;
}

export function runTotals(runs) {
  const all = runHistory(runs);
  const paced = all.filter((r) => r.km >= 1);
  return {
    count: all.length,
    km: Math.round(all.reduce((sum, r) => sum + r.km, 0) * 10) / 10,
    longest: all.length ? Math.max(...all.map((r) => r.km)) : 0,
    bestPace: paced.length ? Math.min(...paced.map((r) => r.pace)) : null,
  };
}
