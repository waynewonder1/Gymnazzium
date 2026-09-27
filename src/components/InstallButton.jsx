import { useEffect, useState } from 'react';
import { canPromptInstall, isStandalone, onInstallChange, promptInstall } from '../lib/install';

// Shown only where the browser can install the app (Chrome/Edge on Android and desktop).
function InstallButton({ className = 'install-btn', label = 'Install app' }) {
  const [available, setAvailable] = useState(() => canPromptInstall() && !isStandalone());

  useEffect(() => onInstallChange(() => setAvailable(canPromptInstall() && !isStandalone())), []);

  if (!available) return null;
  return (
    <button type="button" className={className} onClick={promptInstall}>
      {label}
    </button>
  );
}

export default InstallButton;
