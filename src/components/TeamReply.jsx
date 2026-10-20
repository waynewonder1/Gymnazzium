import { useEffect, useRef, useState } from 'react';
import { useMember } from '../context/member';
import { supabase } from '../lib/supabase';

// When the team has replied to a member's feedback (Admin → Feedback → Reply), show a banner
// once; reading it marks the reply as seen. Only works for feedback sent while logged in.
function TeamReply() {
  const { user, online } = useMember();
  const [replies, setReplies] = useState([]);
  const dialog = useRef(null);
  const userId = user?.id;

  useEffect(() => {
    if (!userId || !online) return;
    let cancelled = false;
    supabase
      .from('feedback')
      .select('id, message, reply, replied_at')
      .eq('user_id', userId)
      .not('reply', 'is', null)
      .is('reply_seen_at', null)
      .order('replied_at', { ascending: true })
      .then(({ data }) => !cancelled && setReplies(data ?? []));
    return () => {
      cancelled = true;
    };
  }, [userId, online]);

  if (replies.length === 0) return null;

  const done = async () => {
    dialog.current?.close();
    const ids = replies.map((r) => r.id);
    setReplies([]);
    await Promise.all(ids.map((id) => supabase.rpc('mark_feedback_reply_seen', { p_id: id })));
  };

  return (
    <>
      <button type="button" className="team-reply-banner" onClick={() => dialog.current?.showModal()}>
        💬 The Gymnazzium team replied to your feedback. <strong>Read it</strong>
      </button>
      <dialog ref={dialog} className="feedback-dialog" aria-labelledby="team-reply-title">
        <div className="feedback-body">
          <h3 id="team-reply-title">A reply from the team</h3>
          {replies.map((r) => (
            <div key={r.id} className="team-reply-item">
              <p className="muted small">You wrote: “{r.message}”</p>
              <p className="team-reply-text">{r.reply}</p>
            </div>
          ))}
          <button type="button" className="btn btn-sm" onClick={done}>Got it</button>
        </div>
      </dialog>
    </>
  );
}

export default TeamReply;
