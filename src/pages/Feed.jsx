import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMember } from '../context/member';
import { badgeInfo } from '../lib/challenges';
import { formatPace, formatTime } from '../lib/runs';
import { deletePost, findPeople, follow, followCounts, giveKudos, joinCommunity, leaveCommunity, loadFeed, takeKudos, unfollow } from '../lib/social';
import InviteButton from '../components/InviteButton';
import ShareSheet from '../components/social/ShareSheet';

function ago(iso) {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
const dayLabel = (iso) => new Date(`${iso}T00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const initial = (name) => name.trim().charAt(0).toUpperCase();

function Feed() {
  const { backendEnabled, authReady, user, online, community } = useMember();

  if (!backendEnabled) return null;
  if (!authReady) return <section className="page-top"><p className="muted">Loading…</p></section>;
  return (
    <section className="page-top feed-page">
      <div className="section-label">Community</div>
      <h1 className="page-title">The feed.</h1>
      {!user ? (
        <>
          <p className="page-lead">See your friends' workouts and runs, cheer them on with 👏 kudos, and let them see yours. It keeps everyone showing up.</p>
          <Link to="/login" state={{ next: '/feed' }} className="btn">Log in to join</Link>
        </>
      ) : !online ? (
        <p className="muted">The feed needs a connection. Your plan still works offline.</p>
      ) : community === undefined ? (
        <p className="muted">Loading…</p>
      ) : community === null ? (
        <JoinCommunity />
      ) : (
        <Community />
      )}
    </section>
  );
}

function JoinCommunity() {
  const { user, profile, setCommunity } = useMember();
  const [name, setName] = useState(profile?.name ?? '');
  const [state, setState] = useState({ busy: false, error: '' });

  const join = async (e) => {
    e.preventDefault();
    const displayName = name.trim().replace(/\s+/g, ' ');
    if (displayName.length < 2 || displayName.length > 24) return setState({ busy: false, error: 'Pick a name of 2 to 24 characters.' });
    setState({ busy: true, error: '' });
    const { error } = await joinCommunity(user.id, displayName);
    if (error) return setState({ busy: false, error: error.code === '23505' ? 'That name is taken. Try another.' : error.message });
    setCommunity({ display_name: displayName });
  };

  return (
    <div className="card flat feed-join">
      <h3>Join the Gymnazzium community</h3>
      <ul className="feed-join-points">
        <li>💪 Your finished workouts, runs and new badges are posted for your followers.</li>
        <li>👏 Friends give you kudos; you cheer them on too.</li>
        <li>🔒 Only stats are shared, never your weight, your weights lifted or your location. You can delete any post or leave any time.</li>
      </ul>
      <form className="inline-form" onSubmit={join}>
        <input aria-label="Display name" placeholder="Your name, as friends know you" maxLength={24} value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-sm" disabled={state.busy}>{state.busy ? 'Joining…' : 'Join'}</button>
      </form>
      {state.error && <p className="form-error small" role="alert">{state.error}</p>}
    </div>
  );
}

function Community() {
  const { user, community, setCommunity } = useMember();
  const [posts, setPosts] = useState(null);
  const [more, setMore] = useState(false);
  const [error, setError] = useState('');
  const [counts, setCounts] = useState(null);
  const [sharing, setSharing] = useState(null); // { kind, data }

  const refresh = useCallback(() => {
    loadFeed()
      .then((rows) => {
        setPosts(rows);
        setMore(rows.length === 30);
        setError('');
      })
      .catch((e) => setError(e.message));
    followCounts(user.id).then(setCounts, () => {});
  }, [user.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loadMore = async () => {
    const rows = await loadFeed(posts.at(-1).created_at).catch(() => []);
    setPosts([...posts, ...rows]);
    setMore(rows.length === 30);
  };

  const toggleKudos = async (post) => {
    const update = (p) => (p.id === post.id ? { ...p, kudoed: !p.kudoed, kudos: Number(p.kudos) + (p.kudoed ? -1 : 1) } : p);
    setPosts((list) => list.map(update));
    const { error: e } = post.kudoed ? await takeKudos(post.id, user.id) : await giveKudos(post.id, user.id);
    if (e) setPosts((list) => list.map((p) => (p.id === post.id ? post : p)));
  };

  const remove = async (post) => {
    if (!window.confirm('Delete this post from the feed? Your workout stays in your plan.')) return;
    const { error: e } = await deletePost(post.id);
    if (!e) setPosts((list) => list.filter((p) => p.id !== post.id));
  };

  const leave = async () => {
    if (!window.confirm('Leave the community? Your posts, follows and kudos are removed. Your plan and progress stay.')) return;
    const { error: e } = await leaveCommunity(user.id);
    if (!e) setCommunity(null);
  };

  return (
    <>
      <div className="feed-me">
        <span className="avatar" aria-hidden="true">{initial(community.display_name)}</span>
        <div>
          <strong>{community.display_name}</strong>
          <span className="muted small">{counts ? `${counts.followers} follower${Number(counts.followers) === 1 ? '' : 's'} · ${counts.following} following` : ' '}</span>
        </div>
        <InviteButton className="btn btn-sm btn-ghost" label="Invite friends" />
      </div>

      <FindFriends onChange={refresh} />

      {error && <p className="form-error small">{error}</p>}
      {posts === null ? (
        <p className="muted">Loading the feed…</p>
      ) : posts.length === 0 ? (
        <div className="card flat feed-empty">
          <h3>Your feed is empty, for now</h3>
          <p>Follow friends above to see their workouts and runs here. Finish a workout and yours will show up too.</p>
        </div>
      ) : (
        <ol className="feed-list">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} mine={post.user_id === user.id} onKudos={() => toggleKudos(post)} onDelete={() => remove(post)} onShare={() => setSharing({ kind: post.kind, data: post.data })} />
          ))}
        </ol>
      )}
      {more && <button type="button" className="btn btn-ghost feed-more" onClick={loadMore}>Load more</button>}

      <p className="muted small feed-leave">
        Posting as {community.display_name} · <button type="button" className="link-btn" onClick={leave}>Leave the community</button>
      </p>
      {sharing && <ShareSheet kind={sharing.kind} data={sharing.data} onClose={() => setSharing(null)} />}
    </>
  );
}

function FindFriends({ onChange }) {
  const { user } = useMember();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (query.trim().length < 2) return;
    let cancelled = false;
    const id = setTimeout(() => findPeople(user.id, query).then((r) => !cancelled && setResults(r)), 300);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [query, user.id]);

  const toggle = async (person) => {
    const { error } = person.following ? await unfollow(user.id, person.user_id) : await follow(user.id, person.user_id);
    if (error) return;
    setResults((list) => list.map((p) => (p.user_id === person.user_id ? { ...p, following: !p.following } : p)));
    onChange();
  };

  return (
    <div className="feed-find">
      <input type="search" aria-label="Find friends" placeholder="🔍 Find friends by name" value={query} onChange={(e) => { setQuery(e.target.value); if (e.target.value.trim().length < 2) setResults(null); }} />
      {results && (
        <ul className="feed-people">
          {results.length === 0 && <li className="muted small">Nobody by that name yet. Invite them!</li>}
          {results.map((p) => (
            <li key={p.user_id}>
              <span className="avatar small" aria-hidden="true">{initial(p.display_name)}</span>
              <span>{p.display_name}</span>
              <button type="button" className={`btn btn-sm${p.following ? ' btn-ghost' : ''}`} onClick={() => toggle(p)}>{p.following ? 'Following ✓' : 'Follow'}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PostCard({ post, mine, onKudos, onDelete, onShare }) {
  const d = post.data ?? {};
  const names = post.kudos_names ?? [];
  const others = Number(post.kudos) - names.length;
  let body;
  if (post.kind === 'run') {
    body = (
      <>
        <p className="post-line">🏃 Ran <strong>{d.km} km</strong></p>
        <p className="post-stats">{formatTime(d.sec)} · {formatPace(d.sec / d.km)}{d.date ? ` · ${dayLabel(d.date)}` : ''}</p>
      </>
    );
  } else if (post.kind === 'workout') {
    const bits = [d.sets > 0 && `${d.sets} sets`, `${d.exercises} exercise${d.exercises === 1 ? '' : 's'}`, d.prs > 0 && `🏆 ${d.prs} new PR${d.prs === 1 ? '' : 's'}`, d.date && dayLabel(d.date)].filter(Boolean);
    body = (
      <>
        <p className="post-line">💪 Finished <strong>{d.title}</strong></p>
        <p className="post-stats">{bits.join(' · ')}</p>
      </>
    );
  } else {
    const b = badgeInfo(d.key ?? post.ref);
    body = <p className="post-line">{b.icon} Earned the <strong>{b.title}</strong> badge</p>;
  }

  return (
    <li className={`post post-${post.kind}`}>
      <div className="post-head">
        <span className="avatar" aria-hidden="true">{initial(post.display_name)}</span>
        <div>
          <strong>{mine ? 'You' : post.display_name}</strong>
          <span className="muted small">{ago(post.created_at)}</span>
        </div>
      </div>
      {body}
      <div className="post-foot">
        {mine ? (
          <span className="muted small">{Number(post.kudos) > 0 ? `👏 ${post.kudos} kudos${names.length ? ` from ${names.join(', ')}${others > 0 ? ` and ${others} more` : ''}` : ''}` : 'No kudos yet'}</span>
        ) : (
          <button type="button" className={`kudos-btn${post.kudoed ? ' on' : ''}`} aria-pressed={post.kudoed} onClick={onKudos}>
            👏 {post.kudoed ? 'Kudos given' : 'Give kudos'}{Number(post.kudos) > 0 ? ` · ${post.kudos}` : ''}
          </button>
        )}
        {mine && (
          <span className="post-actions">
            {post.kind !== 'badge' && <button type="button" className="link-btn" onClick={onShare}>Share</button>}
            <button type="button" className="link-btn" onClick={onDelete}>Delete</button>
          </span>
        )}
      </div>
    </li>
  );
}

export default Feed;
