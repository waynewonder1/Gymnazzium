import { useRef, useState, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { useMember } from '../context/member';
import { supabase } from '../lib/supabase';
import { getRest, subscribeRest } from '../lib/restTimer';

const RATINGS = [
  { value: 1, label: '😞' },
  { value: 2, label: '😕' },
  { value: 3, label: '😐' },
  { value: 4, label: '🙂' },
  { value: 5, label: '🤩' },
];

// "Feedback" button (bottom corner) and its form. Anyone can send; admins read it on /admin.
function Feedback() {
  const { backendEnabled, user, online } = useMember();
  const { pathname } = useLocation();
  const rest = useSyncExternalStore(subscribeRest, getRest);
  const dialog = useRef(null);
  const [rating, setRating] = useState(null);
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [state, setState] = useState({ busy: false, sent: false, error: '' });

  if (!backendEnabled) return null;

  const open = () => {
    setState({ busy: false, sent: false, error: '' });
    if (!contact && user?.email) setContact(user.email);
    dialog.current?.showModal();
  };
  const close = () => dialog.current?.close();

  const send = async (e) => {
    e.preventDefault();
    if (!message.trim()) return setState({ ...state, error: 'Write a few words first.' });
    if (!online) return setState({ ...state, error: "You're offline. Try again when you're connected." });
    setState({ busy: true, sent: false, error: '' });
    const { error } = await supabase.from('feedback').insert({
      rating,
      message: message.trim().slice(0, 2000),
      contact: contact.trim().slice(0, 120) || null,
      page: pathname,
      user_id: user?.id ?? null,
    });
    if (error) return setState({ busy: false, sent: false, error: `Couldn't send it: ${error.message}` });
    setState({ busy: false, sent: true, error: '' });
    setRating(null);
    setMessage('');
  };

  return (
    <>
      {/* Steps aside while the rest timer bar is showing, so they don't overlap. */}
      {!rest.endsAt && (
        <button type="button" className="feedback-btn" onClick={open}>
          💬 Feedback
        </button>
      )}
      <dialog ref={dialog} className="feedback-dialog" aria-labelledby="feedback-title" onClick={(e) => e.target === dialog.current && close()}>
        {state.sent ? (
          <div className="feedback-body">
            <h3 id="feedback-title">Thank you! 🙏</h3>
            <p className="muted">Your feedback goes straight to the Gymnazzium team and helps us make the app better.</p>
            <button type="button" className="btn btn-sm" onClick={close}>Close</button>
          </div>
        ) : (
          <form className="feedback-body" onSubmit={send}>
            <h3 id="feedback-title">Tell us what you think</h3>
            <p className="muted small">What's confusing, what's missing, what you love. Every message is read.</p>
            <fieldset className="feedback-rating">
              <legend className="muted small">How's Gymnazzium so far? (optional)</legend>
              <div>
                {RATINGS.map((r) => (
                  <button type="button" key={r.value} className={`chip${rating === r.value ? ' active' : ''}`} aria-pressed={rating === r.value} aria-label={`${r.value} out of 5`} onClick={() => setRating(rating === r.value ? null : r.value)}>
                    {r.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <label>
              <span className="muted small">Your feedback</span>
              <textarea rows="4" maxLength={2000} required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. I couldn't find where to log my run…" />
            </label>
            <label>
              <span className="muted small">Email or phone, if you'd like a reply (optional)</span>
              <input maxLength={120} value={contact} onChange={(e) => setContact(e.target.value)} />
            </label>
            {state.error && <p className="form-error small" role="alert">{state.error}</p>}
            <div className="form-actions">
              <button className="btn btn-sm" disabled={state.busy}>{state.busy ? 'Sending…' : 'Send feedback'}</button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={close}>Cancel</button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}

export default Feedback;
