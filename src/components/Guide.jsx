import { useState } from 'react';
import { guide } from '../data/guide';

// topicIds: optional list of guide tabs to show (defaults to all).
function Guide({ topicIds }) {
  const topics = topicIds ? guide.filter((t) => topicIds.includes(t.id)) : guide;
  const [activeId, setActiveId] = useState(topics[0].id);
  const topic = topics.find((t) => t.id === activeId) ?? topics[0];

  return (
    <div className="guide">
      <div className="tabs" role="tablist">
        {topics.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === activeId}
            className={`tab ${t.id === activeId ? 'active' : ''}`}
            onClick={() => setActiveId(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <article className="topic" key={topic.id}>
        <h3 className="topic-title">{topic.title}</h3>
        {topic.intro.map((p) => <p key={p} className="topic-intro">{p}</p>)}

        {topic.groups.map((group) => (
          <div className="group" key={group.name}>
            <h4>{group.name}</h4>
            {group.note && <p className="group-note">{group.note}</p>}

            {group.exercises && (
              <div className="exercise-grid">
                {group.exercises.map((ex) => (
                  <div className="exercise" key={ex.name}>
                    <h5>{ex.name}</h5>
                    <p>{ex.text}</p>
                    {ex.dose && <p className="dose">{ex.dose}</p>}
                  </div>
                ))}
              </div>
            )}

            {group.tags && (
              <div className="chips">
                {group.tags.map((tag) => <span className="chip" key={tag}>{tag}</span>)}
              </div>
            )}
          </div>
        ))}

        {topic.steps && (
          <div className="group">
            <h4>{topic.steps.title}</h4>
            <ol className="steps">
              {topic.steps.items.map((s) => <li key={s}>{s}</li>)}
            </ol>
            {topic.steps.note && <p className="group-note">{topic.steps.note}</p>}
          </div>
        )}

        {topic.tip && <p className="tip">{topic.tip}</p>}

        {topic.instructions && (
          <div className="instructions">
            <h4>Instructions</h4>
            <ul>
              {topic.instructions.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </div>
        )}
      </article>
    </div>
  );
}

export default Guide;
