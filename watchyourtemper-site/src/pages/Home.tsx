import '../styles/index.css';
import { useNavigate } from 'react-router-dom';


const Home: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="home-container">
      <div className="bg-burying" />
      <div className="overlay">
        <h1 className="glitch-link" data-text="feed the machine" onClick={() => navigate('/machine')}>feed the machine</h1>
      </div>
    </div>
  );
};

export default Home;
