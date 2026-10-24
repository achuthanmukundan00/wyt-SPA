import { useEffect } from 'react';
import Masthead from '../components/Masthead';
import SiteFooter from '../components/SiteFooter';

const channels = [
  ['Bandcamp', 'https://watchyourtemper.bandcamp.com', '/icons/bandcamp.png'],
  ['Spotify', 'https://open.spotify.com/artist/4J2nrkMqpsfDQcZgSalbht?si=0BOws4dHSginwoO28iy90A', '/icons/spotify.png'],
  ['Apple Music', 'https://music.apple.com/ca/artist/watchyourtemper/1768341683', '/icons/apple_music.png'],
  ['YouTube Music', 'https://music.youtube.com/channel/UCPBklxjs8z1T4-aKNuCgyXQ?si=G5dHuNlRjJnzgLiK', '/icons/youtube_music.png'],
  ['Tidal', 'https://tidal.com/browse/artist/50451699?u', '/icons/tidal.png'],
];

export const ListeningChannels: React.FC = () => (
  <ul className="channels">
    {channels.map(([name, href, icon]) => (
      <li key={name}>
        <a className="channel" href={href} target="_blank" rel="noopener noreferrer">
          <img className="channel-icon" src={icon} alt="" width="48" height="48" loading="lazy" />
          <span className="channel-name">{name}</span><span aria-hidden="true">↗</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </li>
    ))}
  </ul>
);

const FeedTheMachine: React.FC = () => {
  useEffect(() => { document.title = 'watchyourtemper | Listen'; }, []);
  return (
    <main className="site">
      <Masthead />
      <div className="content">
        <section className="block listening" aria-labelledby="listen-title">
          <h1 className="block__name" id="listen-title">Listen</h1>
          <ListeningChannels />
        </section>
      </div>
      <SiteFooter />
    </main>
  );
};

export default FeedTheMachine;
