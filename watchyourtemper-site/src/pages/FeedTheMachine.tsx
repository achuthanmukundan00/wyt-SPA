import '../styles/index.css';

const FeedTheMachine: React.FC = () => {
  return (
    <div className="feed-page">
      <div className="grain-overlay" />
      <div className="profile-container">
        <img src="/images/wyt-avatar-red.png" alt="avatar" className="profile-pic" />
      </div>
      <div className="centered-feed">
        <h2 className="feed-title">Your rage is sacred. Let it speak.</h2>
        <p className="feed-sub">choose your poison</p>
        <div className="link-buttons">
          <a className="feed-btn" href="https://spotify.com">Spotify</a>
          <a className="feed-btn" href="https://music.apple.com">Apple Music</a>
          <a className="feed-btn" href="https://music.youtube.com">YouTube Music</a>
          <a className="feed-btn" href="https://tidal.com">Tidal</a>
          <a className="feed-btn" href="https://watchyourtemper.bandcamp.com">Bandcamp</a>
          <a className="feed-btn join" href="/join">🩸 Join the Inner Circle</a>
        </div>
      </div>
    </div>
  );
};

export default FeedTheMachine;
