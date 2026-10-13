# Gymnazzium

A fitness site that builds each member a day-by-day training plan, with reminders, an exercise library, guides, and a gear shop.

Built with React + Vite. Accounts, synced plans, orders and push notifications run on [Supabase](https://supabase.com).

- **Live site:** https://gymnazzium.vercel.app (hosted on Vercel, deploys automatically from `main`)
- **Code:** https://github.com/waynewonder1/Gymnazzium (private)
- **Backend:** Supabase project `ilrurlfkqcasaxawsjcd`

## What it does

- **Personal plan** (`/plan`): answers from the registration form become a day-by-day plan with a streak, daily missions, heads-ups for hard weeks, nutrition targets and a deep dive on each goal. Gym members get the Gymnazzium 5-day split (strength & form first, then heavy 2 × 6–10); home members get the matching home split (push-up variations, pull-ups or table rows, bodyweight legs, household-object curls), with reps rising every 3 weeks.
- **Your own routine** (`/plan/routine`): members build their own week (days, sections, exercises, sets, reps, custom exercises), starting from their plan, the gym split or a blank week. Plans, reminders and the calendar follow it; they can switch back any time.
- **Running goal** ("Run 1–10 km"): members pick a running level at sign-up; runs go on rest days (Wednesday first, at least one full rest day kept) and build up every 3 weeks to 1–3 km with walk breaks (beginner), 5 km with one break at most (intermediate) or 10 km non-stop (experienced).
- **Weight logging** (on each exercise in the plan): weight × reps per set, "last time", and an *add weight* tip when every set hit the top of the rep range.
- **Progress** (`/progress`): a chart and session table for every logged lift.
- **Challenges** (`/challenges`): four monthly challenges sized to each member's plan (workouts, a run without a miss, sets, PRs), milestone badges with a confetti banner when earned, and an opt-in monthly leaderboard under a display name (ranked by workouts, then sets).
- **Reminders:** web push at the member's workout time (even with the site closed), plus an `.ics` calendar download.
- **Content:** paths, body types, nutrition, supplements (with sources), an exercise library with a rest/interval timer.
- **Shop** (`/shop`): cart and checkout; orders are saved to Supabase and can be sent over WhatsApp.
- **Accounts** (`/login`, `/account`): sign-up, password reset, order history.

## Run it locally

```bash
npm install
npm run dev
```

Without a `.env` file the site runs in **device-only mode**: plans are saved in the browser, there are no accounts, and reminders only fire while the site is open. Everything else works.

## Where things live

| To change… | Edit |
| --- | --- |
| Guide text, paths, body types, home cards | `src/data/guide.js` |
| Detail pages (`/paths/…`, `/body-types/…`, `/learn/…`) and their sources | `src/data/content.js` |
| Exercises, doses, progression | `src/data/workouts.js`, `src/data/exerciseMeta.js` |
| Goal explanations, daily missions, obstacles, challenge tips | `src/data/coaching.js` |
| Products, prices, WhatsApp number | `src/data/shop.js` |
| How plans are generated (incl. the gym split and custom routines) | `src/lib/plan.js` |
| Weight logging rules (last time, add-weight tip, charts) | `src/lib/lifts.js` |
| Routine editor | `src/pages/RoutineEditor.jsx` |

After changing `src/lib/plan.js`, `src/data/workouts.js` or `src/data/coaching.js`, run `npm run functions:sync` so push reminders use the same plan.

Run `npm test` before pushing. The tests (in `tests/`) build a full year of every kind of plan and check the gym and home splits, run days, challenges, badges and progress syncing. No extra install is needed; they use Node's built-in test runner.

## Backend setup (accounts, orders, push reminders)

You need a free Supabase account. Allow about 20 minutes.

### 1. Create the project and database

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard) (region: closest to Kenya, e.g. Frankfurt or Mumbai).
2. Open **SQL Editor** and run each file in `supabase/migrations/` in order (oldest first): paste all of it, then **Run**.
3. **Authentication → URL Configuration**: set **Site URL** to your live site (`https://gymnazzium.vercel.app`) and add `https://gymnazzium.vercel.app/**` and `http://localhost:5173/**` under **Redirect URLs**.

### 2. Connect the website

```bash
cp .env.example .env
npx web-push generate-vapid-keys --json > supabase/.vapid-keys.json   # private, git-ignored
```

Fill in `.env`:

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`: from **Project Settings → API**
- `VITE_VAPID_PUBLIC_KEY`: the `publicKey` from `supabase/.vapid-keys.json`

Restart `npm run dev`. You now have sign-up / log-in, plans synced across devices, and orders saved to the `orders` table (view them in **Table Editor**; update `status` as you confirm, pay and deliver).

### 3. Deploy the push reminder function

```bash
npx supabase login                 # opens the browser; type the short code it shows, then Enter
bash scripts/deploy-reminders.sh   # asks for your email, then does the rest
```

The script checks your keys, stores the secrets on Supabase, deploys `send-reminders`, and writes `supabase/cron.filled.sql` (git-ignored).

### 4. Schedule it

Open `supabase/cron.filled.sql`, copy all of it, paste it into the Supabase SQL Editor and click **Run**. The function then runs every 5 minutes and sends each member one push a day, at their workout time in their own time zone:

- on training days, the workout (skipped if they have already ticked it off),
- on rest days, their daily mission.

**Test it:** log in, open **My plan → Reminders → Turn on for this device**, set your workout time to a minute from now, and wait. On iPhone, add the site to the Home Screen first (Apple only allows web push for installed sites).

## Deploying the site

The site is on **Vercel**, connected to the GitHub repo. Every push to `main` goes live at https://gymnazzium.vercel.app within about a minute:

```bash
git add -A
git commit -m "Describe the change"
git push
```

If you changed `src/lib/plan.js`, `src/data/workouts.js` or `src/data/coaching.js`, also update the reminder function so notifications match:

```bash
npm run functions:sync
npx supabase functions deploy send-reminders --project-ref ilrurlfkqcasaxawsjcd --no-verify-jwt
```

Setting it up again elsewhere:

- **Vercel:** import the repo (preset: Vite) and add the three `VITE_…` variables from `.env`. `vercel.json` already sends every path (`/plan`, `/shop`, …) to the app.
- **Netlify:** same variables; `public/_redirects` already does the routing.
- Then update the Supabase **Site URL** and **Redirect URLs** to the new address.

Push notifications need HTTPS, which both provide.

## Security notes

- Every table has row-level security: members can only read and write their own plan, progress, subscriptions and orders.
- Guests can place orders but can't read any back.
- Order totals are calculated in the browser. Always confirm the amount when you take payment.
- Never put the **service role key** or the **VAPID private key** in `.env` or any `VITE_` variable; those end up in the public website. They belong only in `supabase secrets`.
- These files hold secrets and are git-ignored; keep them off GitHub: `.env`, `supabase/.vapid-keys.json`, `supabase/cron.filled.sql`.
