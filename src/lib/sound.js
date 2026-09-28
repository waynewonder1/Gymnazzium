// Short beeps + vibration for timers. Silent (never throws) where audio isn't available.
let audio;

export function beep(freq = 880, ms = 150) {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, audio.currentTime);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + ms / 1000);
    navigator.vibrate?.(ms);
  } catch {
    // No audio available — the timer still works silently.
  }
}
