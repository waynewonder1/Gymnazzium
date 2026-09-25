// Copies the plan engine into the Edge Function folder, so push reminders use
// exactly the same workouts and missions as the website.
// Run after changing src/lib/plan.js or src/data/{workouts,coaching}.js:  npm run functions:sync
import { copyFileSync, mkdirSync } from 'node:fs';

const files = ['lib/plan.js', 'data/workouts.js', 'data/coaching.js'];
for (const file of files) {
  mkdirSync(new URL(`../supabase/functions/_shared/${file.split('/')[0]}`, import.meta.url), { recursive: true });
  copyFileSync(new URL(`../src/${file}`, import.meta.url), new URL(`../supabase/functions/_shared/${file}`, import.meta.url));
  console.log(`copied src/${file} → supabase/functions/_shared/${file}`);
}
