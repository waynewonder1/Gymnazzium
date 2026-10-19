import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { pagesByKind } from '../data/content';
import { products, shopConfig } from '../data/shop';
import { caliSplit, caliWeek, cardioSplit, cardioWeek, exercises, gymSplit, gymWeek, homeSplit, homeWeek } from '../data/workouts';

// Split sections on path pages: { type: 'split', split: 'gym' | 'home' | 'calisthenics' | 'cardio' }.
const SPLITS = {
  gym: { week: gymWeek, split: gymSplit },
  home: { week: homeWeek, split: homeSplit },
  calisthenics: { week: caliWeek, split: caliSplit },
  cardio: { week: cardioWeek, split: cardioSplit },
};
import CountUp from '../components/CountUp';
import ExerciseCard from '../components/ExerciseCard';
import WorkoutTimer from '../components/WorkoutTimer';
import NutritionCalculator from '../components/NutritionCalculator';
import SkillLadder from '../components/SkillLadder';
import CalorieDeficit from '../components/CalorieDeficit';
import Guide from '../components/Guide';
import ProductCard from '../components/ProductCard';

const weekdayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const kindLabel = { paths: 'Ways to get in shape', 'body-types': 'Body types', learn: 'What we offer' };

function Section({ section }) {
  switch (section.type) {
    case 'intro':
      return <div className="topic-intro-block">{section.text.map((p) => <p key={p}>{p}</p>)}</div>;
    case 'facts':
      return (
        <div className="fact-grid">
          {section.items.map((f) => (
            <div className="fact" key={f.label}>
              <strong className="fact-value"><CountUp value={f.value} /></strong>
              <p>{f.label}</p>
              {f.source && <a className="fact-source" href={f.source.url} target="_blank" rel="noopener noreferrer">Source: {f.source.label.split(':')[0]}</a>}
            </div>
          ))}
        </div>
      );
    case 'points':
      return (
        <div className="grid grid-2 point-grid">
          {section.items.map((p) => (
            <div className="card flat point" key={p.title}>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </div>
          ))}
        </div>
      );
    case 'list': {
      const Tag = section.ordered ? 'ol' : 'ul';
      return <Tag className="topic-list">{section.items.map((i) => <li key={i}>{i}</li>)}</Tag>;
    }
    case 'ladder':
      return (
        <>
          {section.note && <p className="muted section-note">{section.note}</p>}
          <SkillLadder tracks={section.tracks} />
        </>
      );
    case 'week':
      return (
        <>
          {section.note && <p className="muted section-note">{section.note}</p>}
          <div className="week-plan">
            {section.days.map((d) => (
              <div className={`week-plan-day ${/rest/i.test(d.title) ? 'rest' : ''}`} key={d.day}>
                <span className="wday-name">{d.day}</span>
                <strong>{d.title}</strong>
                <span className="muted small">{d.detail}</span>
              </div>
            ))}
          </div>
        </>
      );
    case 'workout':
      return (
        <div className="workout-block">
          <div>
            {section.note && <p className="muted section-note">{section.note}</p>}
            <div className="exercise-grid">
              {section.ids.map((id, i) => <ExerciseCard key={id} id={id} index={i} />)}
            </div>
          </div>
          <WorkoutTimer defaultMode={section.timer ?? 'rest'} />
        </div>
      );
    case 'split':
      return (
        <>
          {section.note && <p className="muted section-note">{section.note}</p>}
          <div className="split-grid">
            {Object.entries((SPLITS[section.split] ?? SPLITS.gym).week.byDay).map(([weekday, key]) => {
              const session = (SPLITS[section.split] ?? SPLITS.gym).split[key];
              return (
                <div className="split-day" key={key}>
                  <span className="wday-name">{weekdayName[weekday]}</span>
                  <h3>{session.title}</h3>
                  <p className="muted small">{session.warmup}</p>
                  {session.groups.map((g) => (
                    <div className="split-group" key={g.name}>
                      <strong>{g.name}</strong>
                      <ol>{g.ids.map((id) => <li key={id}>{exercises[id].name}</li>)}</ol>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      );
    case 'compare':
      return (
        <div className="table-wrap">
          <table className="compare">
            <thead><tr>{section.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>{section.rows.map((r) => <tr key={r[0]}>{r.map((cell, i) => (i === 0 ? <th key={i} scope="row">{cell}</th> : <td key={i}>{cell}</td>))}</tr>)}</tbody>
          </table>
        </div>
      );
    case 'calculator':
      return <NutritionCalculator />;
    case 'deficit':
      return <CalorieDeficit />;
    case 'guide':
      return <Guide topicIds={section.topicIds} />;
    case 'faq':
      return (
        <div className="faq">
          {section.items.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      );
    default:
      return null;
  }
}

function Topic({ kind }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const pages = pagesByKind[kind];
  const page = pages.find((p) => p.slug === slug);

  useEffect(() => {
    document.title = page ? `${page.title} · Gymnazzium` : 'Gymnazzium';
  }, [page]);

  if (!page) {
    return (
      <section className="page-top">
        <h1 className="page-title">Page not found.</h1>
        <Link to="/" className="btn">Back home</Link>
      </section>
    );
  }

  const gear = products
    .map((p) => ({ p, score: (p.recommendedFor ?? []).filter((t) => page.gearTags.includes(t)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.p);
  const index = pages.indexOf(page);
  const others = pages.filter((p) => p !== page);

  const startPlan = () => navigate('/#register', { state: { prefill: page.cta.prefill } });

  return (
    <article className="topic-page" key={page.slug}>
      <header className="page-top topic-hero">
        <div className="blob" />
        <div className="crumbs" role="navigation" aria-label="Breadcrumb">
          <Link to="/">Home</Link> / <Link to={kind === 'learn' ? '/#offers' : kind === 'paths' ? '/#paths' : '/#body-types'}>{kindLabel[kind]}</Link>
        </div>
        <div className="section-label">{page.eyebrow}</div>
        <h1 className="page-title">{page.title}</h1>
        <p className="page-lead">{page.tagline}</p>
        <button className="btn" onClick={startPlan}>{page.cta.label}</button>
      </header>

      {page.sections.map((section, i) => (
        <section className="topic-section" key={i}>
          {section.heading && <h2 className="topic-heading">{section.heading}</h2>}
          <Section section={section} />
        </section>
      ))}

      {shopConfig.storeOpen && gear.length > 0 && (
        <section className="topic-section">
          <h2 className="topic-heading">Gear for this</h2>
          <div className="product-grid">{gear.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      )}

      <section className="topic-section cta-band">
        <h2>Ready to start?</h2>
        <p className="muted">Answer a few questions and get a day-by-day plan built around this.</p>
        <button className="btn" onClick={startPlan}>{page.cta.label}</button>
      </section>

      <section className="topic-section">
        <h2 className="topic-heading">Explore more</h2>
        <div className="grid grid-3 explore">
          {others.map((p) => (
            <Link to={`/${kind}/${p.slug}`} className="card explore-card" key={p.slug}>
              <span className="section-label">{p.eyebrow}</span>
              <h3>{p.title}</h3>
              <p>{p.tagline}</p>
              <span className="arrow">Explore →</span>
            </Link>
          ))}
        </div>
        <div className="pager">
          {index > 0 && <Link to={`/${kind}/${pages[index - 1].slug}`}>← {pages[index - 1].title}</Link>}
          {index < pages.length - 1 && <Link to={`/${kind}/${pages[index + 1].slug}`} className="next">{pages[index + 1].title} →</Link>}
        </div>
      </section>

      {page.sources.length > 0 && (
        <section className="topic-section sources">
          <h2 className="topic-heading">Sources</h2>
          <ol>
            {page.sources.map((s) => (
              <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}

export default Topic;
