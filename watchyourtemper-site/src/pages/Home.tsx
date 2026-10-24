import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ListeningChannels } from './FeedTheMachine';
import SiteFooter from '../components/SiteFooter';

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;
const newTab = <span className="sr-only"> (opens in a new tab)</span>;

// No navbar: the wordmark and one way in, then the page as one piece, with its
// links in the sections and the footer.
const Home: React.FC = () => {
  useEffect(() => { document.title = 'watchyourtemper'; }, []);
  return (
    <main className="site artist-home" data-mode="dark">
      <a className="skip-link" href="#content">Skip to content</a>
      <section className="threshold-entry">
        <h1 className="threshold-mark">
          <img className="artist-mark" src="/assets/images/wordmark-transparent.webp" alt="watchyourtemper" width="2407" height="498" fetchPriority="high" />
        </h1>
        <div className="threshold-bottom">
          <a className="enter display" href="#content">feed the machine <span aria-hidden="true">↓</span></a>
        </div>
      </section>
      <div id="content" className="content" tabIndex={-1}>
        <section id="listen" className="block listening" aria-labelledby="listen-title">
          <h2 className="block__name" id="listen-title">Listen</h2>
          <ListeningChannels />
          <p className="answer">watchyourtemper on Bandcamp, Spotify, Apple Music, YouTube Music and Tidal. <a className="text-link" href="https://soundcloud.com/watchyourtemper" {...external}>SoundCloud&nbsp;↗{newTab}</a></p>
        </section>
        <section id="pressure" className="block related" aria-labelledby="pressure-title">
          <h2 className="block__name" id="pressure-title">PRESSURE TEST</h2>
          <figure className="related__poster">
            <img src="/assets/images/pressure-test-v1-0.jpg" alt="Original PRESSURE TEST v1.0 poster" width="1280" height="1600" loading="lazy" />
          </figure>
          <div className="answer">
            <p>A Toronto music series presented and operated by RYTHM CORPORATION, created by watchyourtemper. Artists play 25 to 40 minutes of their own material. Experimental Forward.</p>
            <p>Live sets from local artists. New work, unfinished tracks, and experiments.</p>
            <a className="text-link" href="/pressure-test/">Enter PRESSURE TEST&nbsp;↗</a>
          </div>
        </section>
        <section className="block elsewhere" aria-labelledby="elsewhere-title">
          <h2 className="block__name" id="elsewhere-title">Elsewhere</h2>
          <ul className="elsewhere__links">
            <li><Link to="/store">Store</Link></li>
            <li><a href="/join" {...external}>Join the mailing list&nbsp;↗{newTab}</a></li>
            <li><a href="https://www.instagram.com/watchyourtemper/" {...external}>Instagram&nbsp;↗{newTab}</a></li>
            <li><a href="https://www.tiktok.com/@watchyourtemper" {...external}>TikTok&nbsp;↗{newTab}</a></li>
            <li><a href="https://www.youtube.com/@watchyourtemper" {...external}>YouTube&nbsp;↗{newTab}</a></li>
          </ul>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
};

export default Home;
