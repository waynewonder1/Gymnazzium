// Whether this device has seen the "How it works" walkthrough on the plan page.
const KEY = 'gymnazzium-plan-guide-seen';

export function guideSeen() {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return true; // storage blocked: don't pop it up on every visit
  }
}

export function markGuideSeen() {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    // Storage blocked: fine, it just shows again next time.
  }
}
