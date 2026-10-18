// Pure logic for the community feed (no network), so it can be tested on its own.

// What changed between two saves of progress that's worth posting: newly finished workouts,
// logged or edited runs, and new badges. Refs carry the plan's start date, so a restarted plan's
// day 5 never collides with the old plan's day 5.
// Undoing a single workout or run removes its post; a plan restart (many at once) keeps old posts.
export function postsFromChange(prev, next, plan) {
  const out = [];
  const before = prev ?? {};
  const ref = (index) => `${plan.startDate}:${index}`;
  for (const index of Object.keys(next.done ?? {})) {
    if (before.done?.[index]) continue;
    const day = plan.describeDay(Number(index));
    if (day) out.push({ action: 'publish', kind: 'workout', ref: ref(index), data: day });
  }
  const undone = Object.keys(before.done ?? {}).filter((index) => !next.done?.[index]);
  if (undone.length === 1) out.push({ action: 'remove', kind: 'workout', ref: ref(undone[0]) });
  for (const [index, run] of Object.entries(next.runs ?? {})) {
    const old = before.runs?.[index];
    if (old && old.km === run.km && old.sec === run.sec) continue;
    out.push({ action: 'publish', kind: 'run', ref: ref(index), data: { km: run.km, sec: run.sec, date: plan.dateOf(Number(index)) } });
  }
  const cleared = Object.keys(before.runs ?? {}).filter((index) => !next.runs?.[index]);
  if (cleared.length === 1) out.push({ action: 'remove', kind: 'run', ref: ref(cleared[0]) });
  for (const key of Object.keys(next.badges ?? {})) {
    if (!before.badges?.[key]) out.push({ action: 'publish', kind: 'badge', ref: key, data: { key } });
  }
  return out;
}
