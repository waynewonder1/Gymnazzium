import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useMember } from '../context/member';
import { supabase } from '../lib/supabase';
import { PLANS, PREMIUM_FEATURES, PREMIUM_OPEN, formatKES, premiumStatus } from '../lib/premium';

const fmtDate = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

// Premium: what it includes, the price, and paying with M-Pesa or card on Paystack's checkout page.
// Paystack sends the member back to /premium?reference=… and the server double-checks the payment.
function Premium() {
  const { backendEnabled, authReady, user } = useMember();
  const [params, setParams] = useSearchParams();
  const reference = params.get('reference');
  const [sub, setSub] = useState(undefined); // undefined = loading, null = never paid
  const [plan, setPlan] = useState('month');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(Boolean(reference));
  const [justPaid, setJustPaid] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      if (reference) {
        // Back from Paystack: ask our server to confirm it with Paystack before showing anything.
        const { data, error: err } = await supabase.functions.invoke('paystack-checkout', { action: 'verify', reference });
        if (cancelled) return;
        setChecking(false);
        setParams({}, { replace: true });
        if (err) setError(err);
        else if (data.status === 'success') {
          setJustPaid(true);
          // Use the date the server just confirmed (don't wait on a second read).
          if (data.premium_until) setSub({ premium_until: data.premium_until });
        }
        else setError("We haven't received that payment yet. If you paid, it can take a minute: refresh this page shortly.");
      }
      const { data } = await supabase.from('subscriptions').select('plan, premium_until').eq('user_id', user.id).maybeSingle();
      if (!cancelled) setSub((current) => data ?? current ?? null);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user, reference, setParams]);

  if (!backendEnabled) return <Navigate to="/" replace />;
  // Switched off (PREMIUM_OPEN): anyone with an old link sees a short note, no checkout.
  // A payment that's still being confirmed (?reference=) is always allowed through.
  if (!PREMIUM_OPEN && !reference) {
    return (
      <section className="page-top premium-page">
        <div className="section-label">Premium</div>
        <h1 className="page-title">Coming soon.</h1>
        <p className="page-lead">Weekly calorie check-ins, Kenyan meal plans and more are on the way. Everything in Gymnazzium stays free in the meantime.</p>
        <Link to="/plan" className="btn">Back to my plan</Link>
      </section>
    );
  }
  if (!authReady) return <section className="page-top"><p className="muted">Loading…</p></section>;

  const status = premiumStatus(sub);

  const pay = async () => {
    if (!navigator.onLine) return setError("You're offline. Connect to the internet to pay.");
    setBusy(true);
    setError('');
    const { data, error: err } = await supabase.functions.invoke('paystack-checkout', { action: 'start', plan });
    if (err || !data?.url) {
      setBusy(false);
      return setError(err ?? 'Something went wrong. Please try again.');
    }
    window.location.assign(data.url); // Paystack's secure checkout: M-Pesa or card
  };

  return (
    <section className="page-top premium-page">
      <div className="section-label">Premium</div>
      <h1 className="page-title">Train smarter. Eat right.</h1>
      <p className="page-lead">Everything in Gymnazzium stays free. Premium adds the tools that do the thinking for you.</p>

      {checking && <p className="banner">Checking your payment with Paystack…</p>}
      {justPaid && status.active && (
        <p className="banner premium-ok" role="status">✅ Payment received. You're Premium until <strong>{fmtDate(status.until)}</strong>. Thank you!</p>
      )}
      {error && <p className="banner warn" role="alert">{error}</p>}

      {status.active && !justPaid && (
        <div className="card premium-status">
          <span className="premium-badge">★ Premium</span>
          <p>Active until <strong>{fmtDate(status.until)}</strong> ({status.daysLeft} day{status.daysLeft === 1 ? '' : 's'} left). Paying again adds to the time you have left.</p>
        </div>
      )}

      <ul className="premium-features">
        {PREMIUM_FEATURES.map((f) => (
          <li key={f.title}>
            <span className="premium-icon" aria-hidden="true">{f.icon}</span>
            <span>
              <strong>{f.title}</strong>
              {f.soon && <span className="tag premium-soon">Coming soon</span>}
              <span className="muted small">{f.text}</span>
            </span>
          </li>
        ))}
      </ul>

      {!user ? (
        <div className="card premium-pay">
          <p>Log in or create a free account first, so Premium is saved to you on every device.</p>
          <Link to="/login" state={{ next: '/premium' }} className="btn">Log in to continue</Link>
        </div>
      ) : (
        <div className="card premium-pay">
          <h2 className="premium-h2">{status.active ? 'Add more time' : 'Choose your plan'}</h2>
          <div className="premium-plans" role="radiogroup" aria-label="Plan">
            {Object.values(PLANS).map((p) => (
              <button type="button" key={p.id} role="radio" aria-checked={plan === p.id} className={`premium-plan${plan === p.id ? ' active' : ''}`} onClick={() => setPlan(p.id)}>
                <span className="premium-plan-label">{p.label}</span>
                <strong>{formatKES(p.price)}</strong>
                {p.note && <span className="premium-plan-note">{p.note}</span>}
              </button>
            ))}
          </div>
          <button type="button" className="btn premium-cta" onClick={pay} disabled={busy || checking}>
            {busy ? 'Opening checkout…' : `Pay ${formatKES(PLANS[plan].price)} with M-Pesa or card`}
          </button>
          <p className="muted small">
            You pay on Paystack's secure page. Premium doesn't renew by itself: nothing is charged again unless you pay again.
            If you have a problem with a payment, use 💬 Feedback and we'll sort it out.
          </p>
        </div>
      )}
    </section>
  );
}

export default Premium;
