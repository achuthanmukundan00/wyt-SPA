import '../styles/artist.css';

const channels = [
  ['Bandcamp', 'https://watchyourtemper.bandcamp.com', '/icons/bandcamp.png'],
  ['Spotify', 'https://open.spotify.com/artist/4J2nrkMqpsfDQcZgSalbht?si=0BOws4dHSginwoO28iy90A', '/icons/spotify.png'],
  ['Apple Music', 'https://music.apple.com/ca/artist/watchyourtemper/1768341683', '/icons/apple_music.png'],
  ['YouTube Music', 'https://music.youtube.com/channel/UCPBklxjs8z1T4-aKNuCgyXQ?si=G5dHuNlRjJnzgLiK', '/icons/youtube_music.png'],
  ['Tidal', 'https://tidal.com/browse/artist/50451699?u', '/icons/tidal.png'],
];

export const ListeningChannels: React.FC = () => (
  <div className="channels">
    {channels.map(([name, href, icon]) => (
      <a className="channel" key={name} href={href} target="_blank" rel="noopener noreferrer">
        <img className="channel-icon" src={icon} alt="" width="48" height="48" loading="lazy" />
        <span className="channel-name">{name}</span><span aria-hidden="true">↗</span>
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    ))}
  </div>
);

const FeedTheMachine: React.FC = () => (
  <main className="artist-content artist-machine">
    <section className="listening">
      <h1 className="display">Listen</h1>
      <ListeningChannels />
    </section>
    <footer className="site-footer"><p>Made with ❤️ in Toronto, Ontario, Canada</p></footer>
  </main>
);

export default FeedTheMachine;
