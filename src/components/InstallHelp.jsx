import InstallButton from './InstallButton';
import { isInAppBrowser, isIOS } from '../lib/install';

// Step-by-step install instructions for the phone and browser the visitor is using.
function InstallHelp() {
  if (isInAppBrowser()) {
    return (
      <>
        <h3>Open it in your browser first</h3>
        <p className="muted small">You opened this link inside another app (like WhatsApp or Instagram), which can't install apps.</p>
        <ol>
          <li>Tap <strong>⋮</strong> or <strong>…</strong> at the top of the screen</li>
          <li>Choose <strong>{isIOS() ? 'Open in Safari' : 'Open in Chrome'}</strong> (or "Open in browser")</li>
          <li>Come back to this section and follow the steps there</li>
        </ol>
      </>
    );
  }
  if (isIOS()) {
    return (
      <>
        <h3>On iPhone or iPad</h3>
        <ol>
          <li>Open this site in <strong>Safari</strong></li>
          <li>Tap <strong>Share</strong> (the square with an arrow, at the bottom or top)</li>
          <li>Scroll down and tap <strong>Add to Home Screen</strong>, then <strong>Add</strong></li>
          <li>Open Gymnazzium from your Home Screen</li>
        </ol>
        <p className="muted small">Workout reminders on iPhone need iOS 16.4 or newer, and only work in the app you opened from your Home Screen. Turn them on from there.</p>
      </>
    );
  }
  return (
    <>
      <h3>Install Gymnazzium</h3>
      <InstallButton className="btn" label="Install the app" />
      <p className="muted small">
        No button? In Chrome, tap <strong>⋮</strong> (top right), then <strong>Install app</strong> or <strong>Add to Home screen</strong>.
        In Samsung Internet, tap <strong>☰</strong>, then <strong>Add page to</strong> → <strong>Home screen</strong>.
      </p>
    </>
  );
}

export default InstallHelp;
