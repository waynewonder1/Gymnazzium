import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useMember } from '../context/member';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../data/shop';

const STATUSES = ['new', 'confirmed', 'paid', 'delivered', 'cancelled'];
const OPEN = ['new', 'confirmed'];
const EARNED = ['paid', 'delivered'];

const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// 0712 345 678 → 254712345678 for WhatsApp links.
function whatsappNumber(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
}

function Admin() {
  const { backendEnabled, authReady, user, isAdmin } = useMember();
  const [allowed, setAllowed] = useState(null); // null = checking

  // The link is hidden from non-admins; this double-checks with the database.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase.rpc('is_admin').then(({ data }) => !cancelled && setAllowed(data === true));
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!backendEnabled) return <Navigate to="/" replace />;
  if (!authReady) return <section className="page-top"><p className="muted">Loading…</p></section>;
  if (!user) return <Navigate to="/login" replace state={{ next: '/admin' }} />;
  if (allowed === null && !isAdmin) return <section className="page-top"><p className="muted">Checking access…</p></section>;
  if (!allowed && !isAdmin) {
    return (
      <section className="page-top">
        <h1 className="page-title">Staff only.</h1>
        <p className="page-lead">This page is for the Gymnazzium team.</p>
        <Link to="/" className="btn">Back home</Link>
      </section>
    );
  }
  return <Dashboard />;
}

async function fetchDashboard() {
  const [s, o] = await Promise.all([
    supabase.rpc('admin_stats'),
    supabase.from('orders').select('id, reference, customer_name, phone, location, items, total, status, created_at').order('created_at', { ascending: false }),
  ]);
  return { stats: s.data ?? null, orders: o.data ?? [], error: (s.error || o.error)?.message ?? '' };
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('open');
  const [saving, setSaving] = useState(null);

  const apply = ({ stats: nextStats, orders: nextOrders, error: nextError }) => {
    setStats(nextStats);
    setOrders(nextOrders);
    setError(nextError);
  };
  const load = useCallback(() => fetchDashboard().then(apply), []);

  useEffect(() => {
    let cancelled = false;
    fetchDashboard().then((result) => !cancelled && apply(result));
    return () => {
      cancelled = true;
    };
  }, []);

  const setStatus = async (order, status) => {
    const previous = order.status;
    setSaving(order.id);
    setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status } : o)));
    const { error: updateError } = await supabase.from('orders').update({ status }).eq('id', order.id);
    if (updateError) {
      setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status: previous } : o)));
      setError(`Couldn't update ${order.reference}: ${updateError.message}`);
    }
    setSaving(null);
  };

  if (!orders) return <section className="page-top"><p className="muted">Loading dashboard…</p></section>;

  const count = (list) => orders.filter((o) => list.includes(o.status)).length;
  const revenue = orders.filter((o) => EARNED.includes(o.status)).reduce((sum, o) => sum + o.total, 0);
  const shown = filter === 'all' ? orders : filter === 'open' ? orders.filter((o) => OPEN.includes(o.status)) : orders.filter((o) => o.status === filter);

  // Best sellers from every order that wasn't cancelled.
  const sellers = {};
  for (const o of orders.filter((x) => x.status !== 'cancelled')) {
    for (const item of o.items) {
      const k = item.name;
      sellers[k] ??= { name: item.name, qty: 0, revenue: 0 };
      sellers[k].qty += item.qty;
      sellers[k].revenue += item.qty * item.price;
    }
  }
  const topSellers = Object.values(sellers).sort((a, b) => b.qty - a.qty).slice(0, 6);

  const filters = [
    ['open', `To do (${count(OPEN)})`],
    ...STATUSES.map((s) => [s, `${s[0].toUpperCase()}${s.slice(1)} (${count([s])})`]),
    ['all', `All (${orders.length})`],
  ];

  return (
    <section className="page-top admin-page">
      <div className="admin-head">
        <div>
          <div className="section-label">Admin</div>
          <h1 className="page-title">Dashboard.</h1>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
      </div>
      {error && <p className="banner warn">{error}</p>}

      <div className="stat-grid admin-stats">
        <div className="stat"><span className="stat-label">Members</span><strong className="stat-value">{stats?.members ?? '–'}</strong><span className="stat-note">+{stats?.members_7d ?? 0} this week</span></div>
        <div className="stat"><span className="stat-label">With a plan</span><strong className="stat-value">{stats?.with_plan ?? '–'}</strong><span className="stat-note">{stats?.active_7d ?? 0} active this week</span></div>
        <div className="stat"><span className="stat-label">Orders to handle</span><strong className="stat-value">{count(OPEN)}</strong><span className="stat-note">New or confirmed</span></div>
        <div className="stat"><span className="stat-label">Revenue</span><strong className="stat-value">{formatPrice(revenue)}</strong><span className="stat-note">Paid + delivered</span></div>
      </div>

      <h2 className="sub-title">Orders</h2>
      <div className="chips admin-filters">
        {filters.map(([key, label]) => (
          <button key={key} className={`chip ${filter === key ? 'active' : ''}`} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="muted">{orders.length === 0 ? 'No orders yet. They appear here as soon as someone checks out.' : 'Nothing here.'}</p>
      ) : (
        <div className="admin-orders">
          {shown.map((o) => (
            <article className={`admin-order status-border-${o.status}`} key={o.id}>
              <div className="admin-order-head">
                <div>
                  <strong>{o.reference}</strong>
                  <span className="muted small">{fmtDateTime(o.created_at)}</span>
                </div>
                <select value={o.status} disabled={saving === o.id} onChange={(e) => setStatus(o, e.target.value)} aria-label={`Status of ${o.reference}`}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className="admin-customer">
                <span>{o.customer_name}</span>
                <span className="muted">{o.location}</span>
                <span className="admin-contact">
                  <a href={`tel:${o.phone.replace(/\s/g, '')}`}>{o.phone}</a>
                  <a href={`https://wa.me/${whatsappNumber(o.phone)}?text=${encodeURIComponent(`Hi ${o.customer_name}, this is Gymnazzium about your order ${o.reference}.`)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                </span>
              </div>
              <ul className="admin-items">
                {o.items.map((i, k) => (
                  <li key={k}><span>{i.qty} × {i.name}{i.size ? ` (${i.size})` : ''}</span><span className="muted">{formatPrice(i.qty * i.price)}</span></li>
                ))}
              </ul>
              <div className="admin-total"><span>Total</span><strong>{formatPrice(o.total)}</strong></div>
            </article>
          ))}
        </div>
      )}

      <div className="grid grid-2 admin-lower">
        <div className="card flat">
          <h3>Best sellers</h3>
          {topSellers.length === 0 ? (
            <p className="muted small">No sales yet.</p>
          ) : (
            <table className="admin-table">
              <thead><tr><th scope="col">Product</th><th scope="col">Sold</th><th scope="col">Revenue</th></tr></thead>
              <tbody>{topSellers.map((p) => <tr key={p.name}><td>{p.name}</td><td>{p.qty}</td><td>{formatPrice(p.revenue)}</td></tr>)}</tbody>
            </table>
          )}
        </div>
        <div className="card flat">
          <h3>Members</h3>
          <p className="muted small">
            {Object.entries(stats?.paths ?? {}).map(([path, n]) => `${path}: ${n}`).join(' · ') || 'No plans yet.'}
            {' · '}{stats?.push_devices ?? 0} devices with reminders on
          </p>
          <table className="admin-table">
            <thead><tr><th scope="col">Recent sign-ups</th><th scope="col">Joined</th><th scope="col">Plan</th></tr></thead>
            <tbody>
              {(stats?.recent ?? []).map((m) => (
                <tr key={m.email}><td className="admin-email">{m.email}</td><td>{fmtDate(m.created_at)}</td><td>{m.has_plan ? m.path : <span className="muted">None yet</span>}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <LeaderboardMembers />
    </section>
  );
}

// Everyone on the leaderboard, with a Remove button (e.g. for a rude display name).
// Removing only takes them off the board; their account and progress are untouched, and they can rejoin.
function LeaderboardMembers() {
  const [members, setMembers] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(
    () =>
      supabase
        .from('leaderboard_members')
        .select('user_id, display_name, joined_at')
        .order('joined_at', { ascending: false })
        .then(({ data, error: e }) => {
          setMembers(data ?? []);
          setError(e?.message ?? '');
        }),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (m) => {
    if (!window.confirm(`Remove "${m.display_name}" from the leaderboard? Their account and progress stay; they can rejoin with a different name.`)) return;
    const { error: e } = await supabase.from('leaderboard_members').delete().eq('user_id', m.user_id);
    if (e) return setError(e.message);
    load();
  };

  return (
    <div className="card flat admin-lower">
      <h3>Leaderboard</h3>
      <p className="muted small">Members who joined the leaderboard and the name others see.</p>
      {error && <p className="form-error small">{error}</p>}
      {members === null ? (
        <p className="muted small">Loading…</p>
      ) : members.length === 0 ? (
        <p className="muted small">Nobody has joined yet.</p>
      ) : (
        <table className="admin-table">
          <thead><tr><th scope="col">Display name</th><th scope="col">Joined</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.user_id}>
                <td>{m.display_name}</td>
                <td>{fmtDate(m.joined_at)}</td>
                <td><button type="button" className="link-btn" onClick={() => remove(m)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Admin;
