import { useEffect, useRef, useState } from 'react';
import { markGuideSeen } from '../../lib/planGuide';

// The steps of the walkthrough. Gym plans talk about weights; the others about bodyweight.
function stepsFor(profile) {
  const gym = profile.lookingFor === 'Gym work';
  return [
    {
      title: 'Welcome to your plan 👋',
      body: [
        "Here's how to use it, in 1 minute. You can open this again any time with the “How it works” button.",
        'Everything is already planned for you: which days you train, which exercises, and how many.',
      ],
    },
    {
      title: '1. Find today',
      body: [
        'The row of days at the top is your week. Today is highlighted. Tap any day to see its workout.',
        'Rest days are part of the plan, not a day off from it. Your muscles grow while you rest.',
      ],
    },
    {
      title: '2. Read the workout',
      body: [
        '“3 × 8–12 reps” means 3 sets. In each set, do the move 8 to 12 times in a row, then rest about 1–2 minutes.',
        'Do the exercises from top to bottom. Start with the warm-up at the top of the day.',
        gym
          ? 'Heavy phase later on? “2 × 6–10 heavy” means fewer, harder sets.'
          : 'Holds like “30 s” mean hold the position for 30 seconds.',
      ],
    },
    {
      title: gym ? '3. Pick your weight' : '3. Find your level',
      body: gym
        ? [
            'Start light. Pick a weight you can lift 12 times with good form, where the last 2 reps feel hard.',
            'When you can do 12 reps on every set, go up a little next time. Too heavy to reach 8? Go lighter.',
            'Not sure? Your first week is for learning the moves, not for lifting heavy.',
          ]
        : [
            'Too hard? Do fewer reps, or the easier version (like push-ups from your knees). Too easy? Slow every rep down.',
            'Your plan gets a little harder every 3 weeks, so start where you are.',
          ],
    },
    {
      title: '4. Not sure how a move goes?',
      body: [
        'Tap “How to” next to any exercise. You get the form tips, and photos or a short clip for many moves.',
      ],
    },
    {
      title: '5. Start your workout',
      body: [
        'Tap ▶ Start workout. It takes you through one set at a time, with a rest timer between sets.',
        'Or tick the exercises off in the list yourself. Either way, your streak and progress are saved.',
      ],
    },
    {
      title: 'Missed a day? 🤝',
      body: [
        "That's normal. Don't try to catch up by doubling up. Just do the next workout on your plan.",
        'Questions? Tap 💬 Feedback, or DM @wonderrrr on TikTok or Instagram.',
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
