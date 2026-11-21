import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// Shown once, right after a new plan is built (when not logged in): an optional free account,
// so the plan survives a lost phone or a cleared browser. Signing in uploads the plan made on
// this device (MemberProvider), so nothing else is needed here.
function SavePlan({ open, onClose }) {
  const dialog = useRef(null);
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [state, setState] = useState('form'); // form | check-email | saved

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
  }, [open]);

  const close = () => {
    dialog.current?.close();
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!navigator.onLine) return setError("You're offline. Your plan is safe on this phone; save it to an account when you're back online.");
    setBusy(true);
    setError('');
    const { data, error: err } = await supabase.auth.signUp({ ...form, options: { emailRedirectTo: `${window.location.origin}/plan` } });
    setBusy(false);
    if (err) return setError(err.message);
    setState(data.session ? 'saved' : 'check-email');
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <dialog ref={dialog} className="feedback-dialog save-plan" aria-labelledby="save-plan-title" onCancel={(e) => { e.preventDefault(); close(); }}>
      <div className="feedback-body">
        {state === 'form' && (
          <form onSubmit={submit} className="save-plan-form">
            <h3 id="save-plan-title">Save your plan? 🔒</h3>
            <p>Right now it's only on this phone. A free account keeps it safe if you lose your phone, lets you use it on any device, and turns on workout reminders.</p>
            <label>Email<input type="email" required autoComplete="email" value={form.email} onChange={update('email')} /></label>
            <label>Password<input type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={update('password')} /></label>
            <p className="muted small">At least 8 characters. By saving you agree to how we handle your data: <Link to="/privacy" onClick={close}>Privacy</Link>.</p>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save my plan'}</button>
            <button type="button" className="btn btn-ghost" onClick={close}>Not now</button>
            <p className="muted small">Already have an account? <Link to="/login" state={{ next: '/plan' }} onClick={close}>Log in</Link></p>
          </form>
        )}
        {state === 'check-email' && (
          <>
            <h3 id="save-plan-title">Check your email 📬</h3>
            <p>Tap the link we sent to <strong>{form.email}</strong> on this phone, and your plan is saved to your account.</p>
            <button type="button" className="btn" onClick={close}>Got it</button>
          </>
        )}
        {state === 'saved' && (
          <>
            <h3 id="save-plan-title">Saved ✅</h3>
            <p>Your plan is in your account now. Log in on any device to pick it up.</p>
            <button type="button" className="btn" onClick={close}>Let's go</button>
          </>
        )}
      </div>
    </dialog>
  );
}

export default SavePlan;
