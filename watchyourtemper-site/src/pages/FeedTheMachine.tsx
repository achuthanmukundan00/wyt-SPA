import "../styles/index.css";

const FeedTheMachine: React.FC = () => {
  return (
    <div className="feed-page dark-corner">
      <video className="bg-video" autoPlay muted loop playsInline>
        <source src="/assets/videos/feed-bg.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="grain-overlay" />
      <div className="scanlines" />
      <div className="vignette" />

      <div className="machine-wrapper">
        <div className="machine-left" />

        <div className="machine-divider" />

        <div className="machine-right">
          <h2 className="machine-title terminal-flicker">Your rage is sacred.</h2>
          <h2 className="machine-title terminal-flicker delay">Let it speak.</h2>
          <p className="machine-sub typewriter">choose your poison</p>

          <div className="machine-links">
            <a className="feed-btn" href="https://spotify.com" target="_blank">
              <img src="/icons/spotify.png" alt="Spotify" className="btn-icon" />
              Spotify
            </a>
            <a className="feed-btn" href="https://music.apple.com" target="_blank">
              <img src="/icons/apple_music.png" alt="Apple Music" className="btn-icon" />
              Apple Music
            </a>
            <a className="feed-btn" href="https://music.youtube.com" target="_blank">
              <img src="/icons/youtube_music.png" alt="Youtube Music" className="btn-icon" />
              YouTube Music
            </a>
            <a className="feed-btn" href="https://tidal.com" target="_blank">
              <img src="/icons/tidal.png" alt="Tidal" className="btn-icon" />
              Tidal
            </a>
            <a className="feed-btn" href="https://watchyourtemper.bandcamp.com" target="_blank">
              <img src="/icons/bandcamp.png" alt="Bandcamp" className="btn-icon" />
              Bandcamp
            </a>
            <a className="feed-btn join blood-link" href="https://dashboard.mailerlite.com/forms/1434970/150992102536250799/share">
              🩸 Join the Inner Circle
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedTheMachine;
