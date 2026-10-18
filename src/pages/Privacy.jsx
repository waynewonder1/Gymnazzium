import { Link } from 'react-router-dom';

const CONTACT = 'wonderwayne2006@gmail.com';
const UPDATED = '18 October 2026';

// Plain-language privacy notice. Keep it in step with what the app actually stores
// (supabase/migrations/*.sql, src/lib/storage.js) whenever that changes.
function Privacy() {
  return (
    <section className="page-top privacy">
      <div className="section-label">Privacy</div>
      <h1 className="page-title">Your data, plainly.</h1>
      <p className="page-lead">What Gymnazzium stores, why, who can see it, and how to delete it. Last updated {UPDATED}.</p>

      <h2 className="sub-title">The short version</h2>
      <ul>
        <li>We only store what we need to build your plan, sync it, send your reminders and handle your orders.</li>
        <li>No ads, no trackers, and we never sell your data.</li>
        <li>Other members can't see your plan or progress. The leaderboard and the community feed are opt-in.</li>
        <li>You can delete your account and data yourself, any time, on your <Link to="/account">Account</Link> page.</li>
      </ul>

      <h2 className="sub-title">What we store</h2>
      <h3>If you use Gymnazzium without an account</h3>
      <p>Your plan details and progress are saved only in this browser on your device. They aren't sent to us.</p>
      <h3>If you create an account</h3>
      <ul>
        <li><strong>Login:</strong> your email address. Your password is handled by our login provider; we never see it.</li>
        <li><strong>Your plan:</strong> the answers you give when you build it (name, age, weight, height, gender, level, goals, how and when you train, start date, anything you write about what might get in your way) and your time zone, so reminders arrive at the right hour.</li>
        <li><strong>Your progress:</strong> workouts and exercises you tick, daily missions, logged sets and runs, and badges.</li>
        <li><strong>Reminders:</strong> if you turn on push reminders, your device's push address and the dates reminders were sent.</li>
        <li><strong>Leaderboard:</strong> only if you join it, the display name you choose.</li>
        <li><strong>Community feed:</strong> only if you join it, your community name, who you follow, kudos you give, and posts made when you finish a workout, log a run or earn a badge (workout name, sets, exercises, PR count, run distance, time and pace). Never your body weight, the weights you lift or your location.</li>
      </ul>
      <h3>If you order from the shop</h3>
      <p>Your name, phone number, delivery location, what you ordered and the total, so we can confirm, deliver and keep a record of the sale.</p>

      <h2 className="sub-title">Why</h2>
      <p>To build and adjust your training plan and nutrition targets, keep it in sync across your devices, send the reminders you ask for, run the challenges and leaderboard, and fulfil orders. Your age, weight and height are used only to work out your plan and targets.</p>

      <h2 className="sub-title">Who can see it</h2>
      <ul>
        <li><strong>You.</strong> Each member can only read and change their own plan, progress and orders.</li>
        <li><strong>Gymnazzium staff</strong> can see shop orders, and a list of members' email addresses, sign-up dates and chosen training path, to run the service. Staff don't browse your plan or progress.</li>
        <li><strong>Other members</strong> see nothing about you, unless you join the leaderboard (they see your display name, your workouts and sets that month, and how many badges you have) or the community feed (members can find your community name; people who follow you see your posts and who gave them kudos). You can delete any post, or leave the community, any time.</li>
      </ul>

      <h2 className="sub-title">Services we use</h2>
      <ul>
        <li><strong>Supabase:</strong> stores accounts and data. Its servers are in Ireland (EU).</li>
        <li><strong>Vercel:</strong> hosts the website.</li>
        <li><strong>Brevo:</strong> sends account emails (confirming sign-up, resetting passwords).</li>
        <li><strong>Google Fonts:</strong> provides the site's fonts, so Google sees your device's IP address when they load.</li>
        <li><strong>Your browser's push service</strong> (such as Google's for Chrome) delivers reminders if you turn them on.</li>
      </ul>
      <p>These services handle data only to provide their service to us.</p>

      <h2 className="sub-title">How long we keep it</h2>
      <p>Your account data is kept until you delete your plan or your account. Shop orders are kept as business records; if you delete your account, they're no longer linked to you.</p>

      <h2 className="sub-title">Your rights</h2>
      <p>Under Kenya's Data Protection Act, 2019, you can:</p>
      <ul>
        <li><strong>See</strong> what we hold about you: your plan, progress and orders are all in the app.</li>
        <li><strong>Correct</strong> it: edit your details any time.</li>
        <li><strong>Delete</strong> it: on the <Link to="/account">Account</Link> page, choose <em>Delete my account</em>. Or email us and we'll do it.</li>
        <li><strong>Object or ask questions:</strong> email us. If you're not happy with our answer, you can complain to the Office of the Data Protection Commissioner (ODPC).</li>
      </ul>

      <h2 className="sub-title">Young members</h2>
      <p>Gymnazzium is for people aged 13 and over. If you're under 18, please use it with a parent or guardian's OK.</p>

      <h2 className="sub-title">Contact</h2>
      <p>Questions or requests: <strong>{CONTACT}</strong></p>
    </section>
  );
}

export default Privacy;
