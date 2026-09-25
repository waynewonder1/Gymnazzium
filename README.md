# Gymnazzium

A fitness site that builds each member a day-by-day training plan, with reminders, an exercise library, guides, and a gear shop.

Built with React + Vite. Accounts, synced plans, orders and push notifications run on [Supabase](https://supabase.com).

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
| How plans are generated | `src/lib/plan.js` |

After changing `src/lib/plan.js`, `src/data/workouts.js` or `src/data/coaching.js`, run `npm run functions:sync` so push reminders use the same plan.

## Backend setup (accounts, orders, push reminders)

You need a free Supabase account. Allow about 20 minutes.

### 1. Create the project and database

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard) (region: closest to Kenya, e.g. Frankfurt or Mumbai).
2. Open **SQL Editor**, paste all of `supabase/migrations/20260924000000_init.sql`, and run it.
3. **Authentication → URL Configuration**: set **Site URL** to your live site (e.g. `https://gymnazzium.netlify.app`) and add `http://localhost:5173` under **Redirect URLs**.

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

Any static host works. Build with `npm run build` and publish `dist/`. Add the three `VITE_…` variables in the host's environment settings.

The site uses real URLs (`/plan`, `/shop`, …), so the host must send every path to `index.html`:

- **Netlify**: add a `public/_redirects` file containing `/*  /index.html  200`
- **Vercel**: works out of the box for Vite

Push notifications need HTTPS, which both provide.

## Security notes

- Every table has row-level security: members can only read and write their own plan, progress, subscriptions and orders.
- Guests can place orders but can't read any back.
- Order totals are calculated in the browser. Always confirm the amount when you take payment.
- Never put the **service role key** or the **VAPID private key** in `.env` or any `VITE_` variable; those end up in the public website. They belong only in `supabase secrets`.
