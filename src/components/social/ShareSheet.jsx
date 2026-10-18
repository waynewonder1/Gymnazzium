import { useEffect, useRef, useState } from 'react';
import { makeShareImage } from '../../lib/shareCard';

// Preview + share/download for a workout or run share image.
// Phones get the share menu (Instagram, WhatsApp…); everywhere else, a download.
function ShareSheet({ kind, data, onClose }) {
  const dialog = useRef(null);
  const [style, setStyle] = useState('card');
  const [image, setImage] = useState(null); // { blob, url }
  const [message, setMessage] = useState('');

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let url = null;
    makeShareImage({ kind, data, style }).then((blob) => {
      if (cancelled || !blob) return;
      url = URL.createObjectURL(blob);
      setImage({ blob, url });
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [kind, data, style]);

  const fileName = `gymnazzium-${kind}-${style}.png`;
  const file = image ? new File([image.blob], fileName, { type: 'image/png' }) : null;
  const canShareFile = Boolean(file && navigator.canShare?.({ files: [file] }));

  const share = async () => {
    setMessage('');
    try {
      await navigator.share({ files: [file] });
    } catch (e) {
      if (e.name !== 'AbortError') setMessage("Couldn't open sharing here. Use Download instead.");
    }
  };

  const close = () => {
    dialog.current?.close();
    onClose();
  };

  return (
    <dialog ref={dialog} className="share-sheet" aria-labelledby="share-title" onClose={onClose} onClick={(e) => e.target === dialog.current && close()}>
      <div className="share-body">
        <div className="share-head">
          <h3 id="share-title">Share your {kind === 'run' ? 'run' : 'workout'}</h3>
          <button type="button" className="icon-btn small-btn" onClick={close} aria-label="Close">✕</button>
        </div>
        <div className="chips" role="group" aria-label="Image style">
          <button type="button" className={`chip${style === 'card' ? ' active' : ''}`} aria-pressed={style === 'card'} onClick={() => setStyle('card')}>Story card</button>
          <button type="button" className={`chip${style === 'sticker' ? ' active' : ''}`} aria-pressed={style === 'sticker'} onClick={() => setStyle('sticker')}>Sticker (see-through)</button>
        </div>
        <div className={`share-preview ${style}`}>
          {image ? <img src={image.url} alt={`Your ${kind} ${style}`} /> : <p className="muted small">Making your image…</p>}
        </div>
        <p className="muted small">
          {style === 'sticker'
            ? 'Add it on top of your own photo: in Instagram stories, use the sticker or photo button to place it.'
            : 'Post it straight to your story or WhatsApp status.'}
        </p>
        <div className="form-actions">
          {canShareFile && <button type="button" className="btn" onClick={share}>Share…</button>}
          {image && (
            <a className={`btn${canShareFile ? ' btn-ghost' : ''}`} href={image.url} download={fileName}>Download image</a>
          )}
        </div>
        {message && <p className="form-error small">{message}</p>}
      </div>
    </dialog>
  );
}

export default ShareSheet;
