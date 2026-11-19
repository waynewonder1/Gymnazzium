import { useState } from 'react';
import { exerciseMedia, photoSrc, videoSrc } from '../data/exerciseMedia';

// Photo of the move (tap to see the next one, e.g. start → finish), and a short clip if there is one.
// Images load lazily and the clip only downloads when someone taps "Watch", to stay light on data.
function ExerciseMedia({ id, name, compact = false }) {
  const media = exerciseMedia[id];
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  if (!media) return null;

  const count = media.photos.length;
  const caption = playing ? 'Clip: watch the full rep' : media.photos[i];

  return (
    <figure className={`ex-media${compact ? ' compact' : ''}`}>
      <div className={`ex-media-frame${media.wide ? ' wide' : ''}`}>
        {playing ? (
          <video src={videoSrc(id)} poster={photoSrc(id, 0)} autoPlay muted loop playsInline aria-label={`${name}, short clip`} />
        ) : (
          <button type="button" className="ex-media-photo" onClick={() => count > 1 && setI((i + 1) % count)} disabled={count < 2} aria-label={count > 1 ? `${name}: photo ${i + 1} of ${count}, tap for the next` : undefined}>
            <img src={photoSrc(id, i)} alt={`${name}: ${media.photos[i]}`} width="640" height={media.wide ? 384 : 800} loading="lazy" decoding="async" />
            {count > 1 && <span className="ex-media-count">{i + 1}/{count}</span>}
          </button>
        )}
        {media.video && (
          <button type="button" className="ex-media-play" onClick={() => setPlaying(!playing)}>
            {playing ? 'Photos' : '▶ Watch'}
          </button>
        )}
      </div>
      <figcaption className="muted small">{caption}</figcaption>
    </figure>
  );
}

export default ExerciseMedia;
