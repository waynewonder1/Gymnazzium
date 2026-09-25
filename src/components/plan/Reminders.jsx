import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMember } from '../../context/member';
import { downloadCalendar } from '../../lib/calendar';
import { remindersEnabled, remindersSupported, setRemindersEnabled } from '../../lib/reminders';
import { currentSubscription, disablePush, enablePush, needsHomeScreen, pushAvailable, testNotification } from '../../lib/push';

// Real push (works with the site closed): needs the backend, VAPID key and a signed-in member.
function PushCard({ workoutTime }) {
  const { user } = useMember();
  const [status, setStatus] = useState('checking'); // checking | off | on | busy
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    currentSubscription()
      .then((sub) => !cancelled && setStatus(sub ? 'on' : 'off'))
      .catch(() => !cancelled && setStatus('off'));
    return () => {
      cancelled = true;
    };
  }, []);

  const turnOn = async () => {
    setStatus('busy');
    setError('');
    try {
      await enablePush(user.id);
      await testNotification();
      setStatus('on');
    } catch (e) {
      setStatus('off');
      setError(
        e.message === 'blocked'
          ? "Notifications are blocked for this site. Allow them in your browser's site settings, then try again."
          : e.message === 'dismissed'
            ? 'You closed the permission prompt. Tap the button again when you are ready.'
            : `Couldn't turn on reminders: ${e.message}`
      );
    }
  };

  const turnOff = async () => {
    setStatus('busy');
    await disablePush().catch(() => {});
    setStatus('off');
  };

  return (
    <div className="card flat">
      <h3>Push reminders</h3>
      <p>A notification at {workoutTime} on training days, and your mission on rest days. Arrives even when this site is closed.</p>
      {!user ? (
        <Link to="/login" state={{ next: '/plan#reminders' }} className="btn">Log in to turn on</Link>
      ) : needsHomeScreen() ? (
        <p className="muted small">On iPhone, first tap Share → “Add to Home Screen”, then open Gymnazzium from your Home Screen and turn reminders on there.</p>
      ) : status === 'on' ? (
        <button className="btn btn-ghost" onClick={turnOff}>On for this device ✓ · Turn off</button>
      ) : (
        <button className="btn" onClick={turnOn} disabled={status !== 'off'}>
          {status === 'busy' ? 'Turning on…' : 'Turn on for this device'}
        </button>
      )}
      {error && <p className="form-error small">{error}</p>}
    </div>
  );
}

// Fallback without a backend: notifications only while the site is open in a tab.
function TabReminderCard({ workoutTime }) {
  const supported = remindersSupported();
  const [on, setOn] = useState(remindersEnabled);
  const [denied, setDenied] = useState(supported && Notification.permission === 'denied');

  const enable = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setRemindersEnabled(true);
      setOn(true);
      new Notification('Reminders are on', { body: `We'll nudge you at ${workoutTime} while Gymnazzium is open.` });
    } else {
      setDenied(permission === 'denied');
    }
  };

  return (
    <div className="card flat">
      <h3>Browser reminders</h3>
      <p>A notification at your workout time on training days, and your mission on rest days. Only works while this site is open in a tab.</p>
      {!supported ? (
        <p className="muted small">Your browser doesn't support notifications.</p>
      ) : denied ? (
        <p className="muted small">Notifications are blocked. Allow them in your browser's site settings to turn this on.</p>
      ) : on ? (
        <button className="btn btn-ghost" onClick={() => { setRemindersEnabled(false); setOn(false); }}>Reminders on ✓ · Turn off</button>
      ) : (
        <button className="btn" onClick={enable}>Turn on reminders</button>
      )}
    </div>
  );
}

function Reminders({ profile, onChangeTime }) {
  return (
    <div className="grid grid-3">
      <div className="card flat">
        <h3>Workout time</h3>
        <p>Your reminders and calendar events use this time.</p>
        <input type="time" className="time-input" value={profile.workoutTime} onChange={(e) => onChangeTime(e.target.value)} />
      </div>

      {pushAvailable() ? <PushCard workoutTime={profile.workoutTime} /> : <TabReminderCard workoutTime={profile.workoutTime} />}

      <div className="card flat">
        <h3>Phone calendar</h3>
        <p>Add every upcoming workout to Google, Apple or Outlook Calendar, with an alert 15 minutes before.</p>
        <button className="btn" onClick={() => downloadCalendar(profile)}>Add to calendar (.ics)</button>
      </div>
    </div>
  );
}

export default Reminders;
