import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMember } from '../context/member';
import { exercises } from '../data/workouts';
import { exerciseMeta } from '../data/exerciseMeta';
import { doseFor } from '../lib/plan';
import { PAIN_AREAS, PROTEIN_FOODS, SEE_A_DOCTOR, alternativesFor, comeback, foodTips, plateaus, routeQuestion, upcomingExercises } from '../lib/coach';
import { backendEnabled, supabase } from '../lib/supabase';

const QUICK = [
  ['pain', '😣 Something hurts'],
  ['swap', '🔁 I can’t do an exercise'],
  ['comeback', '📅 I missed some days'],
  ['food', '🍽️ What should I eat?'],
  ['plateau', '📈 I’ve stopped improving'],
  ['soreness', '🤕 Sore or injured?'],
];

// The free coach: instant answers from the member's own plan and logs (lib/coach.js).
function Coach() {
  const { profile, authReady, syncing } = useMember();
  const [chat, setChat] = useState([]); // [{ id, question, topic }]
  const [text, setText] = useState('');
  const bottom = useRef(null);

  useEffect(() => {
    if (chat.length) bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [chat.length]);

  if (!profile) {
    return (
      <section className="page-top">
        {!authReady || syncing ? <p className="muted">Loading…</p> : (
          <>
            <div className="section-label">Coach</div>
            <h1 className="page-title">Build your plan first.</h1>
            <p className="page-lead">The coach answers from your own plan and progress, so it needs a plan to work with.</p>
            <Link to="/plan" className="btn">Build my plan</Link>
          </>
        )}
      </section>
    );
  }

  const ask = (question, topic = routeQuestion(question)) => setChat((c) => [...c, { id: Date.now() + c.length, question, topic }]);
  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    ask(text.trim());
    setText('');
  };

  return (
    <section className="page-top coach-page">
      <div className="section-label">Coach</div>
      <h1 className="page-title">Ask the coach.</h1>
      <p className="page-lead">Instant answers built from your plan and your progress, {profile.name}. Tap a question or type your own.</p>

      <div className="chips coach-quick">
        {QUICK.map(([topic, label]) => (
          <button key={topic} type="button" className="chip" onClick={() => ask(label, topic)}>{label}</button>
        ))}
      </div>

      <ol className="coach-chat" aria-live="polite">
        {chat.map((m, i) => (
          <li key={m.id} ref={i === chat.length - 1 ? bottom : null}>
            <p className="coach-q">{m.question}</p>
            <div className="coach-a">
              <span className="coach-badge" aria-hidden="true">G.</span>
              <div className="coach-a-body"><Answer topic={m.topic} question={m.question} /></div>
            </div>
          </li>
        ))}
      </ol>

      <form className="coach-ask" onSubmit={submit}>
        <input aria-label="Ask the coach" placeholder="e.g. My knee hurts on lunges" maxLength={300} value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn btn-sm">Ask</button>
      </form>
      <p className="muted small">General fitness guidance, not medical advice. For pain that is sharp or doesn't go away, see a doctor or physiotherapist.</p>
    </section>
  );
}

function Answer({ topic, question }) {
  if (topic === 'pain') return <PainAnswer />;
  if (topic === 'swap') return <SwapAnswer />;
  if (topic === 'comeback') return <ComebackAnswer />;
  if (topic === 'food') return <FoodAnswer />;
  if (topic === 'plateau') return <PlateauAnswer />;
  if (topic === 'soreness') return <SorenessAnswer />;
  return <UnknownAnswer question={question} />;
}

function MoveList({ ids }) {
  const { profile } = useMember();
  return (
    <ul className="coach-moves">
      {ids.map((id) => (
        <li key={id}>
          <strong>{exercises[id].name}</strong> <span className="coach-dose">{doseFor(id, profile.level).dose}</span>
          <span className="muted small">{exercises[id].cue} · {exerciseMeta[id]?.equipment ?? ''}</span>
        </li>
      ))}
    </ul>
  );
}

function PainAnswer() {
  const [area, setArea] = useState(null);
  const a = area && PAIN_AREAS[area];
  return (
    <>
      <p>Sorry to hear that. First rule: <strong>if a move causes sharp pain, stop that move</strong>, not your whole workout. Where does it hurt?</p>
      <div className="chips">
        {Object.entries(PAIN_AREAS).map(([key, v]) => (
          <button key={key} type="button" className={`chip${area === key ? ' active' : ''}`} onClick={() => setArea(key)}>{v.label}</button>
        ))}
      </div>
      {a && (
        <>
          <p><strong>Skip for now:</strong> {a.avoid}.</p>
          <p><strong>Gentler moves you can still do:</strong></p>
          <MoveList ids={a.gentler} />
        </>
      )}
      <p className="coach-warn"><strong>See a doctor or physio if:</strong></p>
      <ul className="coach-list">{SEE_A_DOCTOR.map((s) => <li key={s}>{s}</li>)}</ul>
    </>
  );
}

function SwapAnswer() {
  const { profile } = useMember();
  const [pick, setPick] = useState(null);
  const list = upcomingExercises(profile);
  const alts = pick ? alternativesFor(pick, profile) : [];
  return (
    <>
      <p>No problem. Which one? These are the exercises in your plan this week:</p>
      <div className="chips">
        {list.map((e) => (
          <button key={e.id} type="button" className={`chip${pick === e.id ? ' active' : ''}`} onClick={() => setPick(e.id)}>{e.name}</button>
        ))}
      </div>
      {pick && (alts.length ? (
        <>
          <p>Do one of these <strong>instead</strong>. Same main muscle ({exerciseMeta[pick].muscles[0].toLowerCase()}), and no harder:</p>
          <MoveList ids={alts} />
          <p className="muted small">Then tick {exercises[pick].name} off in your plan as done. You did the work.</p>
        </>
      ) : (
        <p>This one has no easier swap in the library. Do fewer reps, or hold the position for a few seconds instead.</p>
      ))}
    </>
  );
}

function ComebackAnswer() {
  const { profile, progress } = useMember();
  const c = comeback(profile, progress);
  return (
    <>
      <p><strong>{c.title}.</strong></p>
      <ol className="coach-list">{c.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      <Link to="/plan#today" className="btn btn-sm">Go to today's workout</Link>
    </>
  );
}

function FoodAnswer() {
  const { profile } = useMember();
  const f = foodTips(profile);
  return (
    <>
      <p>Your daily targets (from your weight, height, age and goals):</p>
      <div className="coach-targets">
        <div><strong>{f.target.toLocaleString()}</strong><span>calories</span></div>
        <div><strong>{f.protein} g</strong><span>protein</span></div>
        <div><strong>{f.water} L</strong><span>water</span></div>
      </div>
      <ul className="coach-list">{f.ideas.map((s) => <li key={s}>{s}</li>)}</ul>
      <p><strong>Cheap protein, roughly per portion:</strong></p>
      <ul className="coach-list coach-protein">{PROTEIN_FOODS.map(([food, g]) => <li key={food}>{food} <span className="coach-dose">≈ {g} g</span></li>)}</ul>
    </>
  );
}

function PlateauAnswer() {
  const { progress } = useMember();
  const logged = Object.keys(progress.lifts ?? {}).length > 0 || Object.keys(progress.runs ?? {}).length > 0;
  const stuck = plateaus(progress);
  if (!logged) {
    return <p>I can spot plateaus once you log your sets or runs. Use <strong>▶ Start workout</strong> on My plan: it logs as you go, one tap per set.</p>;
  }
  if (stuck.length === 0) {
    return <p>Good news: nothing you've logged has been stuck for 3 sessions in a row. Keep going, and keep logging so I can keep an eye on it. 💪</p>;
  }
  return (
    <>
      <p>Here's what hasn't moved in your last 3 sessions, and how to break through:</p>
      <ul className="coach-moves">{stuck.map((p) => <li key={p.id}><strong>{p.name}</strong><span className="muted small">{p.tip}</span></li>)}</ul>
      <p className="muted small">Also check the basics: 7–8 hours of sleep and hitting your protein target matter as much as the training.</p>
    </>
  );
}

function SorenessAnswer() {
  return (
    <>
      <p><strong>Soreness is normal; sharp pain is not.</strong></p>
      <ul className="coach-list">
        <li><strong>Normal soreness:</strong> a dull ache in the muscles you trained, starting 1–2 days after, gone in 2–4 days. Light movement, sleep, water and protein help.</li>
        <li><strong>Not normal:</strong> sharp or stabbing pain, pain in a joint, swelling, or pain that gets worse when you train.</li>
        <li>Sore? You can still train other muscles, or go for an easy walk. Don't skip the plan completely.</li>
      </ul>
      <p className="coach-warn"><strong>See a doctor or physio if:</strong></p>
      <ul className="coach-list">{SEE_A_DOCTOR.map((s) => <li key={s}>{s}</li>)}</ul>
    </>
  );
}

// Questions the free coach can't answer go to the team (and show what a future AI coach should cover).
function UnknownAnswer({ question }) {
  const { user } = useMember();
  const [sent, setSent] = useState(false);
  const send = async () => {
    const { error } = await supabase.from('feedback').insert({ message: `Coach question: ${question}`.slice(0, 2000), page: '/coach', user_id: user?.id ?? null, contact: user?.email ?? null });
    if (!error) setSent(true);
  };
  return (
    <>
      <p>I can't answer that one yet. I can help with pain, swapping exercises, missed days, food and plateaus (try the buttons above).</p>
      {backendEnabled && (sent ? <p className="muted small">Sent to the Gymnazzium team. Thanks! 🙏</p> : <button type="button" className="btn btn-sm btn-ghost" onClick={send}>Send my question to the team</button>)}
    </>
  );
}

export default Coach;
