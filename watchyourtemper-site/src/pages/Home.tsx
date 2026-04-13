import '../styles/index.css';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const backgroundVideoId = 'hvVGt5L7_tM';

  return (
    <div className="home-container">
      <div className="video-background" aria-hidden="true">
        <iframe
          className="video-background-iframe"
          src={`https://www.youtube-nocookie.com/embed/${backgroundVideoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${backgroundVideoId}&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1`}
          title="Background video"
          allow="autoplay; fullscreen; picture-in-picture"
          tabIndex={-1}
        />
      </div>
      <div className="overlay">
        <h1 className="glitch-link" data-text="feed the machine" onClick={() => navigate('/machine')}>
          feed the machine
        </h1>
      </div>
    </div>
  );
};

export default Home;
