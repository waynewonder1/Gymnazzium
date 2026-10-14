import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useMember } from '../context/member';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../data/shop';
import { todayIndex, totalDays } from '../lib/plan';

function Orders({ userId }) {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('orders')
      .select('reference, items, total, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => !cancelled && setOrders(data ?? []));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (orders === null) return <p className="muted">Loading orders…</p>;
  if (orders.length === 0) return <p className="muted">No orders yet. <Link to="/shop">Visit the shop</Link>.</p>;
  return (
    <ul className="order-list">
      {orders.map((o) => (
        <li key={o.reference}>
          <div>
            <strong>{o.reference}</strong>
            <span className="muted small">{new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <span className="muted small">{o.items.map((i) => `${i.qty} × ${i.name}${i.size ? ` (${i.size})` : ''}`).join(', ')}</span>
          <div>
            <span className={`status status-${o.status}`}>{o.status}</span>
            <strong>{formatPrice(o.total)}</strong>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ChangePassword() {
  const [password, setPassword] = useState('');
  const [state, setState] = useState({ busy: false, message: '', error: '' });

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, message: '', error: '' });
    const { error } = await supabase.auth.updateUser({ password });
    setState({ busy: false, message: error ? '' : 'Password updated.', error: error?.message ?? '' });
    if (!error) setPassword('');
  };

  return (
    <form className="inline-form" onSubmit={submit}>
      <input type="password" required minLength={8} autoComplete="new-password" placeholder="New password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className="btn btn-sm" disabled={state.busy}>Update</button>
      {state.message && <p className="small ok">{state.message}</p>}
      {state.error && <p className="form-error small">{state.error}</p>}
    </form>
  );
}

// Deletes the login and everything linked to it (see supabase/migrations/…_delete_account.sql).
function DeleteAccount({ onDeleted }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [state, setState] = useState({ busy: false, error: '' });

  const remove = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: '' });
    const { error } = await supabase.rpc('delete_my_account');
    if (error) return setState({ busy: false, error: `Couldn't delete your account: ${error.message}` });
    await onDeleted();
  };

  return (
    <div className="card flat danger-zone">
      <h3>Delete my account</h3>
      <p>
        This permanently deletes your login, your plan, all your progress, badges, logged lifts and runs, your reminders and your leaderboard entry.
        Shop orders you placed are kept for our records, but are no longer linked to you. This can't be undone.
      </p>
      {!open ? (
        <button type="button" className="btn btn-sm btn-ghost danger" onClick={() => setOpen(true)}>Delete my account…</button>
      ) : (
        <form className="inline-form" onSubmit={remove}>
          <input aria-label="Type DELETE to confirm" placeholder="Type DELETE to confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
          <button className="btn btn-sm danger-solid" disabled={typed.trim() !== 'DELETE' || state.busy}>{state.busy ? 'Deleting…' : 'Delete forever'}</button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setOpen(false); setTyped(''); }}>Cancel</button>
        </form>
      )}
      {state.error && <p className="form-error small" role="alert">{state.error}</p>}
    </div>
  );
}

function Account() {
  const { backendEnabled, authReady, user, profile, clearPlan, signOut } = useMember();
  const navigate = useNavigate();

  if (!backendEnabled) return <Navigate to="/login" replace />;
  if (!authReady) return <section className="page-top"><p className="muted">Loading…</p></section>;
  if (!user) return <Navigate to="/login" replace state={{ next: '/account' }} />;

  const deletePlan = async () => {
    if (!window.confirm('Delete your plan and all progress from your account? This cannot be undone.')) return;
    await clearPlan();
    navigate('/#register');
  };

  // Leave the page first, so this page doesn't redirect to /login (and remember /account) mid-logout.
  const logOut = async () => {
    navigate('/', { replace: true });
    await signOut();
  };

  // The account is gone on the server; clear this browser too and say so on the home page.
  const accountDeleted = async () => {
    navigate('/', { replace: true, state: { notice: 'Your account and all its data have been deleted.' } });
    await signOut().catch(() => {});
  };

  const day = profile ? todayIndex(profile) + 1 : null;

  return (
    <section className="page-top">
      <div className="section-label">Account</div>
      <h1 className="page-title">{profile ? `Hey, ${profile.name}.` : 'Your account.'}</h1>
      <p className="page-lead">Signed in as {user.email}</p>

      <div className="grid grid-2 account-grid">
        <div className="card flat">
          <h3>Your plan</h3>
          {profile ? (
            <>
              <p>{profile.timeline} · {profile.lookingFor} · {profile.schedule}. {day >= 1 && day <= totalDays(profile) ? `Day ${day} of ${totalDays(profile)}.` : ''}</p>
              <div className="form-actions">
                <Link to="/plan" className="btn btn-sm">Open plan</Link>
                <Link to="/#register" state={{ edit: true }} className="btn btn-sm btn-ghost">Edit details</Link>
              </div>
            </>
          ) : (
            <>
              <p>You don't have a plan yet.</p>
              <Link to="/#register" className="btn btn-sm">Build my plan</Link>
            </>
          )}
        </div>

        <div className="card flat">
          <h3>Password</h3>
          <p>Change the password you use to log in.</p>
          <ChangePassword />
        </div>
      </div>

      <h3 className="sub-title">Your orders</h3>
      <Orders userId={user.id} />

      <div className="plan-actions account-actions">
        <button className="btn btn-ghost" onClick={logOut}>Log out</button>
        {profile && <button className="btn btn-ghost danger" onClick={deletePlan}>Delete my plan data</button>}
      </div>

      <DeleteAccount onDeleted={accountDeleted} />
      <p className="muted small">How we handle your data: <Link to="/privacy">Privacy</Link>.</p>
    </section>
  );
}

export default Account;
