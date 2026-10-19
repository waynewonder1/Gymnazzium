import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { intro, paths, bodyTypes, offers } from '../data/guide';
import { products, shopConfig } from '../data/shop';
import { exercises } from '../data/workouts';
import { bodyTypeLinks, offerLinks, pathLinks } from '../data/links';
import { useMember } from '../context/member';
import Registration from '../components/Registration';
import ProductCard from '../components/ProductCard';
import CountUp from '../components/CountUp';
import InstallHelp from '../components/InstallHelp';
import { isStandalone } from '../lib/install';

const steps = [
  { title: 'Register', text: 'Tell us your stats, goals, schedule and what usually stops you.' },
  { title: 'Get your plan', text: 'A day-by-day programme built for your level that steps up every 3 weeks.' },
  { title: 'Get reminded', text: 'Workout reminders, daily missions and a heads-up before the hard weeks hit.' },
  { title: 'Track it', text: 'Tick off sets, build a streak, and see how far you’ve come.' },
];

const featured = ['jump-rope', 'pullup-bar', 'hoodie', 'shaker'];

const numbers = [
  { value: '150', label: 'minutes of moderate activity a week is the minimum the WHO recommends for adults' },
  { value: '31%', label: 'of adults worldwide are not active enough, and the number is rising' },
  { value: '2', label: 'strength sessions a week is the minimum, and push-ups count' },
  { value: '7', label: 'hours of sleep a night. Less raises the risk of obesity, diabetes and heart disease' },
];

function Home() {
  const carouselRef = useRef(null);
  const { profile } = useMember();

  const scrollCarousel = (direction) => {
    carouselRef.current?.scrollBy({ left: direction * 300, behavior: 'smooth' });
  };

  return (
    <>
      <div className="hero">
        <div className="blob"></div>
        <img className="hero-logo" src="/brand/gymnazzium-metal.webp" alt="Gymnazzium" width="1012" height="762" />
        <div className="hero-eyebrow">{intro.eyebrow}</div>
        <h1>Get in shape<br /><em>your way.</em></h1>
        <p>{intro.lead}</p>
        <div className="pillars">
          {intro.pillars.map((p) => <span key={p}>{p}</span>)}
        </div>
        <a href="#register" className="cta">Build my plan</a>
      </div>

      <section id="how">
        <div className="section-label">How it works</div>
        <h2 className="section-title reveal">A plan that knows your day.</h2>
        <div className="grid grid-4">
          {steps.map((s, i) => (
            <div className="card reveal" key={s.title}>
              <div className="num">{String(i + 1).padStart(2, '0')}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="numbers" className="numbers-band">
        <div className="numbers">
          {numbers.map((n) => (
            <div key={n.label}>
              <strong><CountUp value={n.value} /></strong>
              <p>{n.label}</p>
            </div>
          ))}
        </div>
        <p className="muted small numbers-source">Sources: WHO 2020 physical activity guidelines &amp; fact sheet; CDC. See the <Link to="/paths/overall-cardio">cardio page</Link> for links.</p>
      </section>

      <section id="paths">
        <div className="section-label">Ways to get in shape</div>
        <h2 className="section-title reveal">There are many ways to get in shape. Pick yours.</h2>
        <div className="grid grid-4">
          {paths.map((p, i) => (
            <Link to={pathLinks[p.title]} className="card card-link reveal" key={p.title}>
              <div className="num">{String(i + 1).padStart(2, '0')}</div>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
              <span className="arrow">Explore →</span>
            </Link>
          ))}
        </div>
      </section>

      <section id="body-types">
        <div className="section-label">Body types</div>
        <h2 className="section-title reveal">What do you want to look like? It depends on you.</h2>
        <div className="carousel-wrap reveal">
          <div className="carousel" ref={carouselRef}>
            {bodyTypes.map((b) => (
              <Link to={bodyTypeLinks[b.title]} className={`slide slide-${bodyTypeLinks[b.title].split('/').pop()}`} key={b.title}>
                <div>
                  <span>{b.title}</span>
                  <p>{b.text}</p>
                  <em className="arrow">See how →</em>
                </div>
              </Link>
            ))}
          </div>
          <div className="carousel-btns">
            <button onClick={() => scrollCarousel(-1)} aria-label="Previous">←</button>
            <button onClick={() => scrollCarousel(1)} aria-label="Next">→</button>
          </div>
        </div>
      </section>

      <section id="offers">
        <div className="section-label">What we offer</div>
        <h2 className="section-title reveal">Four things that get you results.</h2>
        <div className="grid grid-4">
          {offers.map((o, i) => (
            <Link to={offerLinks[o.title]} className="card card-link reveal" key={o.title}>
              <div className="num">{String(i + 1).padStart(2, '0')}</div>
              <h3>{o.title}</h3>
              <p>{o.text}</p>
              <span className="arrow">Learn more →</span>
            </Link>
          ))}
        </div>
      </section>

      <section id="register">
        <div className="section-label">Registration</div>
        <h2 className="section-title reveal">Tell us about you. We’ll build the plan.</h2>
        <Registration key={profile?.startDate ?? 'new'} />
      </section>

      {!isStandalone() && (
        <section id="get-the-app" className="app-teaser">
          <div>
            <div className="section-label">Get the app</div>
            <h2 className="section-title reveal">No Wi-Fi at your gym? No problem.</h2>
            <ul className="app-points">
              <li>Opens straight from your home screen, like any app</li>
              <li>Works offline: today's workout, ticking sets, logging weights, the timer</li>
              <li>Syncs to your account when you're back online</li>
              <li>Workout reminders on your phone</li>
            </ul>
          </div>
          <div className="app-install card flat">
            <InstallHelp />
          </div>
        </section>
      )}

      <section id="library-teaser" className="teaser">
        <div>
          <div className="section-label">Exercise library</div>
          <h2 className="section-title reveal">{Object.keys(exercises).length} moves. Form cues. A built-in timer.</h2>
          <p className="muted">Search by muscle, filter to no-equipment moves, and time your rest and intervals.</p>
        </div>
        <Link to="/exercises" className="btn">Open the library</Link>
      </section>

      {shopConfig.storeOpen && (
        <section id="shop-teaser">
          <div className="section-label">Our shop</div>
          <h2 className="section-title reveal">Gear up.</h2>
          <div className="product-grid">
            {featured.map((id) => <ProductCard key={id} product={products.find((p) => p.id === id)} />)}
          </div>
          <Link to="/shop" className="btn btn-ghost see-all">See the full shop →</Link>
        </section>
      )}
    </>
  );
}

export default Home;
