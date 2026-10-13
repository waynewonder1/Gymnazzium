// Shared test fixtures. Run the tests with: npm test
import { mock } from 'node:test';

// Freeze "today" so plans (which count days from the start date) are predictable.
// 12 Oct 2026 is a Monday.
export function freezeToday(iso = '2026-10-12T09:00:00') {
  mock.timers.enable({ apis: ['Date'], now: new Date(iso) });
}

export const profileFor = (overrides = {}) => ({
  name: 'Test',
  age: '25',
  weight: '70',
  height: '175',
  gender: 'Prefer not to say',
  level: 'Beginner',
  goals: ['Build muscle'],
  lookingFor: 'Gym work',
  timeline: '3 months',
  schedule: '5+ days a week',
  workoutTime: '06:30',
  startDate: '2026-10-12',
  challenges: [],
  challengesNote: '',
  ...overrides,
});

export const emptyProgress = () => ({ done: {}, checks: {}, missions: {}, lifts: {}, badges: {} });

export const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
