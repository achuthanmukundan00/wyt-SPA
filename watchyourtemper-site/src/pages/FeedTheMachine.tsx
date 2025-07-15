import "../styles/index.css";

const FeedTheMachine: React.FC = () => {
  return (
    <div className="feed-page dark-corner">
      <video className="bg-video" autoPlay muted loop playsInline>
        <source src="/assets/videos/buried-bg.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="grain-overlay" />
      <div className="vignette" />

      <div className="machine-wrapper">
        <div className="machine-left" />

        <div className="machine-divider" />

        <div className="machine-right">
          <h2 className="machine-title terminal-flicker glitch-text">YOUR RAGE IS SACRED. LET IT SPEAK.</h2>
          <p className="machine-sub">CHOOSE YOUR WEAPON</p>

          <div className="machine-links">
            <a className="feed-btn" href="https://open.spotify.com/artist/4J2nrkMqpsfDQcZgSalbht?si=0BOws4dHSginwoO28iy90A" target="_blank">
              <img src="/icons/spotify.png" alt="Spotify" className="btn-icon" />
              SPOTIFY
            </a>
            <a className="feed-btn" href="https://music.apple.com/ca/artist/watchyourtemper/1768341683" target="_blank">
              <img src="/icons/apple_music.png" alt="Apple Music" className="btn-icon" />
              APPLE MUSIC
            </a>
            <a className="feed-btn" href="https://music.youtube.com/channel/UCPBklxjs8z1T4-aKNuCgyXQ?si=G5dHuNlRjJnzgLiK" target="_blank">
              <img src="/icons/youtube_music.png" alt="Youtube Music" className="btn-icon" />
              YOUTUBE MUSIC
            </a>
            <a className="feed-btn" href="https://tidal.com/browse/artist/50451699?u" target="_blank">
              <img src="/icons/tidal.png" alt="Tidal" className="btn-icon" />
              TIDAL
            </a>
            <a className="feed-btn" href="https://watchyourtemper.bandcamp.com" target="_blank">
              <img src="/icons/bandcamp.png" alt="Bandcamp" className="btn-icon" />
              BANDCAMP
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedTheMachine;
