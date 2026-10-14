import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useMember } from '../context/member';
import { supabase } from '../lib/supabase';

const titles = { signin: 'Welcome back.', signup: 'Create your account.', reset: 'Reset your password.' };

function Login() {
  const { backendEnabled, user } = useMember();
  const navigate = useNavigate();
  const location = useLocation();
  // The plan page shows a loading state while an account's plan downloads.
  const next = location.state?.next ?? '/plan';

  const [mode, setMode] = useState('signin'); // signin | signup | reset
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (!backendEnabled) {
    return (
      <section className="page-top">
        <div className="section-label">Accounts</div>
        <h1 className="page-title">Coming soon.</h1>
        <p className="page-lead">Accounts aren't switched on yet. Your plan is saved on this device in the meantime.</p>
        <Link to="/plan" className="btn">Go to my plan</Link>
      </section>
    );
  }
  if (user) return <Navigate to={next} replace />;

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const switchTo = (m) => {
    setMode(m);
    setError('');
    setMessage('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!navigator.onLine) {
      setError("You're offline. Connect to the internet to log in or sign up. Your plan still works offline.");
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    const redirect = `${window.location.origin}${mode === 'reset' ? '/account' : '/plan'}`;

    let result;
    if (mode === 'signin') {
      result = await supabase.auth.signInWithPassword(form);
    } else if (mode === 'signup') {
      result = await supabase.auth.signUp({ ...form, options: { emailRedirectTo: redirect } });
      if (!result.error && !result.data.session) {
        setMessage('Almost there! Check your email and tap the link to confirm your account. Your plan will be waiting.');
      }
    } else {
      result = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo: redirect });
      if (!result.error) setMessage("If that email has an account, a reset link is on its way. It'll sign you in so you can set a new password.");
    }

    setBusy(false);
    if (result.error) setError(result.error.message);
    else if (result.data?.session) navigate(next, { replace: true });
  };

  return (
    <section className="page-top auth-page">
      <div className="section-label">Account</div>
      <h1 className="page-title">{titles[mode]}</h1>
      <p className="page-lead">
        {mode === 'signup'
          ? 'Save your plan, use it on any device, and get push reminders at your workout time.'
          : mode === 'reset'
            ? "Enter your email and we'll send you a link."
            : 'Log in to pick up your plan where you left off.'}
      </p>

      <form className="card reg-form auth-form" onSubmit={submit}>
        {mode !== 'reset' && (
          <div className="tabs auth-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={mode === 'signin'} className={`tab ${mode === 'signin' ? 'active' : ''}`} onClick={() => switchTo('signin')}>Log in</button>
            <button type="button" role="tab" aria-selected={mode === 'signup'} className={`tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => switchTo('signup')}>Sign up</button>
          </div>
        )}
        <label>Email<input type="email" required autoComplete="email" value={form.email} onChange={update('email')} /></label>
        {mode !== 'reset' && (
          <label>Password
            <input
              type="password"
              required
              minLength={8}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={form.password}
              onChange={update('password')}
            />
          </label>
        )}
        {mode === 'signup' && <p className="muted small">At least 8 characters.</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {message && <p className="banner" role="status">{message}</p>}
        <button type="submit" className="btn" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'signin' ? 'Log in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
        </button>
        {mode === 'signin' && <button type="button" className="link-btn" onClick={() => switchTo('reset')}>Forgot your password?</button>}
        {mode === 'reset' && <button type="button" className="link-btn" onClick={() => switchTo('signin')}>Back to log in</button>}
        {mode === 'signup' && <p className="muted small">By creating an account you agree to how we handle your data: <Link to="/privacy">Privacy</Link>.</p>}
      </form>
    </section>
  );
}

export default Login;
