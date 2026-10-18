// Share images for workouts and runs, drawn in the browser (Canvas API), Strava "sticker" style.
//   card:    1080 × 1920 story image, dark background, logo + stats
//   sticker: 1080 × 1080 transparent PNG (logo + stats only) to place on your own photo
import { formatPace, formatTime } from './runs.js';

const LOGO = '/brand/gymnazzium-metal.png';
const RED = '#FF4B3E';
const TEXT = '#ECEFEC';
const DIM = '#9AA39F';

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// The lines of big text and small labels for a post.
export function shareStats(kind, data) {
  if (kind === 'run') {
    const pace = data.sec / data.km;
    return { headline: `${Number(data.km).toFixed(data.km % 1 ? 1 : 0)} KM`, sub: 'RUN', stats: [[formatTime(data.sec), 'TIME'], [formatPace(pace).replace(' /km', ''), 'PACE /KM']] };
  }
  const stats = [];
  if (data.sets > 0) stats.push([String(data.sets), 'SETS']);
  stats.push([String(data.exercises), 'EXERCISES']);
  if (data.prs > 0) stats.push([String(data.prs), data.prs === 1 ? 'NEW PR' : 'NEW PRS']);
  else if (data.minutes) stats.push([`~${data.minutes}`, 'MINUTES']);
  return { headline: String(data.title).toUpperCase(), sub: 'WORKOUT DONE', stats };
}

// Shrinks a font size until the text fits the width.
function fit(ctx, text, maxWidth, size, font) {
  let s = size;
  do {
    ctx.font = `${s}px ${font}`;
    s -= 4;
  } while (ctx.measureText(text).width > maxWidth && s > 24);
  return s + 4;
}

export async function makeShareImage({ kind, data, style = 'card' }) {
  await Promise.all([document.fonts.load('100px Anton'), document.fonts.load('600 40px "Work Sans"')]).catch(() => {});
  const logo = await loadImage(LOGO);
  const sticker = style === 'sticker';
  const W = 1080;
  const H = sticker ? 1080 : 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const { headline, sub, stats } = shareStats(kind, data);

  if (!sticker) {
    ctx.fillStyle = '#0A0E0C';
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, 640, 40, W / 2, 640, 900);
    glow.addColorStop(0, 'rgba(255,75,62,0.30)');
    glow.addColorStop(1, 'rgba(255,75,62,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  }
  // On a sticker, a soft shadow keeps white text readable on any photo.
  const shadow = (on) => {
    ctx.shadowColor = on && sticker ? 'rgba(0,0,0,0.65)' : 'transparent';
    ctx.shadowBlur = on && sticker ? 18 : 0;
  };

  // Logo
  const logoW = sticker ? 640 : 860;
  const logoH = (logo.height / logo.width) * logoW;
  let y = sticker ? 40 : 400; // card: roughly centres logo + stats in the 1920-tall story
  shadow(true);
  ctx.drawImage(logo, (W - logoW) / 2, y, logoW, logoH);
  y += logoH + (sticker ? 40 : 110);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  // Small label (WORKOUT DONE / RUN)
  ctx.fillStyle = RED;
  ctx.font = `600 ${sticker ? 34 : 40}px "Work Sans", sans-serif`;
  ctx.letterSpacing = '8px';
  ctx.fillText(sub, W / 2, y);
  ctx.letterSpacing = '0px';
  y += sticker ? 56 : 80;

  // Headline (workout name or distance)
  const size = fit(ctx, headline, W - 120, kind === 'run' ? (sticker ? 170 : 220) : sticker ? 110 : 140, 'Anton, sans-serif');
  ctx.fillStyle = TEXT;
  ctx.font = `${size}px Anton, sans-serif`;
  ctx.fillText(headline, W / 2, y);
  y += size * 1.15 + (sticker ? 20 : 60);

  // Stats row
  const colW = (W - 120) / stats.length;
  stats.forEach(([value, label], i) => {
    const x = 60 + colW * i + colW / 2;
    ctx.fillStyle = TEXT;
    ctx.font = `${sticker ? 76 : 96}px Anton, sans-serif`;
    ctx.fillText(value, x, y);
    ctx.fillStyle = DIM;
    ctx.font = `600 ${sticker ? 26 : 30}px "Work Sans", sans-serif`;
    ctx.fillText(label, x, y + (sticker ? 92 : 116));
  });
  shadow(false);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
