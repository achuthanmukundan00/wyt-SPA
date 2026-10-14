import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ListeningChannels } from './FeedTheMachine';
import '../styles/artist.css';

const Home: React.FC = () => {
  useEffect(() => { document.title = 'watchyourtemper'; }, []);
  return (
    <main className="artist-home" id="mockup" data-mode="dark">
      <a className="skip-link" href="#article">Skip to content</a>
      <section className="threshold-entry">
        <div className="threshold-headroom" aria-hidden="true" />
        <div className="threshold-mark">
          <h1 className="brand">
            <Link to="/" aria-label="watchyourtemper">
              <img className="artist-mark" src="/assets/images/wordmark-transparent.webp" alt="watchyourtemper" width="2407" height="498" fetchPriority="high" />
            </Link>
          </h1>
        </div>
        <div className="threshold-bottom">
          <a className="enter display" href="#article">feed the machine <span aria-hidden="true">↓</span></a>
          <nav className="primary-nav" aria-label="Primary navigation">
            <a href="#article">Listen</a>
            <Link to="/store">Store <span aria-hidden="true">↗</span></Link>
            <a href="/join" target="_blank" rel="noopener noreferrer">Join ↗<span className="sr-only"> (opens in a new tab)</span></a>
            <a href="/pressure-test/">PRESSURE TEST <span aria-hidden="true">↗</span></a>
          </nav>
        </div>
      </section>
      <article id="article" className="artist-content" tabIndex={-1}>
        <section id="listen" className="listening">
          <h2>Listen</h2>
          <ListeningChannels />
          <p>watchyourtemper on Bandcamp, Spotify, Apple Music, YouTube Music and Tidal. <a href="https://soundcloud.com/watchyourtemper" target="_blank" rel="noopener noreferrer">SoundCloud ↗<span className="sr-only"> (opens in a new tab)</span></a></p>
        </section>
        <section id="pressure" className="related">
          <div>
            <h2>PRESSURE TEST</h2>
            <p>A Toronto music series presented and operated by RYTHM CORPORATION, created by watchyourtemper. Artists play 25 to 40 minutes of their own material. All genres welcome.</p>
            <p>Live sets from local artists. New work, unfinished tracks, and experiments. All sounds welcome.</p>
            <a href="/pressure-test/">Enter PRESSURE TEST ↗</a>
          </div>
          <img src="/assets/images/pressure-test-v1-0.jpg" alt="Original PRESSURE TEST v1.0 poster" width="1280" height="1600" loading="lazy" />
        </section>
        <section className="artist-destinations">
          <h2>Elsewhere</h2>
          <div>
            <Link to="/store">Store ↗</Link>
            <a href="/join" target="_blank" rel="noopener noreferrer">Join the mailing list ↗<span className="sr-only"> (opens in a new tab)</span></a>
            <a href="https://www.instagram.com/watchyourtemper/" target="_blank" rel="noopener noreferrer">Instagram ↗<span className="sr-only"> (opens in a new tab)</span></a>
          </div>
        </section>
      </article>
      <footer className="site-footer">
        <p>Made with ❤️ in Toronto, Ontario, Canada</p>
        <p>watchyourtemper<br />Toronto, Canada</p>
        <div>
          <a href="https://www.instagram.com/watchyourtemper/" target="_blank" rel="noopener noreferrer">Instagram ↗<span className="sr-only"> (opens in a new tab)</span></a>
          <a href="/pressure-test/">PRESSURE TEST ↗</a>
        </div>
      </footer>
    </main>
  );
};

export default Home;
