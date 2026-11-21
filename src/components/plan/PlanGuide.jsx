import { useEffect, useRef, useState } from 'react';
import { markGuideSeen } from '../../lib/planGuide';

// The steps of the walkthrough. Gym plans talk about weights; the others about bodyweight.
function stepsFor(profile) {
  const gym = profile.lookingFor === 'Gym work';
  return [
    {
      title: 'Your plan is ready 👋',
      body: [
        'Everything is planned for you: which days you train, which exercises, and how many.',
        'The row of days is your week. Today is highlighted; tap any day to see it. Rest days are part of the plan: your muscles grow while you rest.',
      ],
    },
    {
      title: 'Reading a workout',
      body: [
        '“3 × 8–12 reps” means 3 sets. In each set, do the move 8 to 12 times, then rest about 1–2 minutes.',
        gym
          ? 'Start light: a weight you can lift 12 times with good form. When every set hits 12, go up a little next time.'
          : 'Too hard? Do fewer reps or the easier version. Too easy? Slow every rep down. It gets harder every 3 weeks.',
        'Not sure how a move goes? Tap “How to” for tips, photos or a short clip.',
      ],
    },
    {
      title: 'Start your workout 💪',
      body: [
        'Tap ▶ Start workout. It takes you through one set at a time, with a rest timer in between.',
        "Missed a day? Don't double up, just do the next workout. Questions? DM @wonderrrr on TikTok or Instagram.",
        'You can open this again any time with “How it works”.',
      ],
    },
  ];
}

// "How it works" walkthrough for the plan page. Opens by itself the first time.
function PlanGuide({ profile, open, onClose }) {
  const dialog = useRef(null);
  const [step, setStep] = useState(0);
  const steps = stepsFor(profile);
  const s = steps[step];
  const last = step === steps.length - 1;

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
  }, [open]);

  const close = () => {
    markGuideSeen();
    dialog.current?.close();
    setStep(0);
    onClose();
  };

  return (
    <dialog ref={dialog} className="feedback-dialog plan-guide" aria-labelledby="plan-guide-title" onCancel={(e) => { e.preventDefault(); close(); }}>
      <div className="feedback-body">
        <span className="muted small">{step + 1} of {steps.length}</span>
        <div className="progress-bar" aria-hidden="true"><div style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
        <h3 id="plan-guide-title">{s.title}</h3>
        {s.body.map((p) => <p key={p}>{p}</p>)}
        <div className="form-actions">
          {step > 0 && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setStep(step - 1)}>← Back</button>}
          <button type="button" className="btn btn-sm" onClick={last ? close : () => setStep(step + 1)}>{last ? "Let's go 💪" : 'Next →'}</button>
          {!last && <button type="button" className="link-btn" onClick={close}>Skip</button>}
        </div>
      </div>
    </dialog>
  );
}

export default PlanGuide;
