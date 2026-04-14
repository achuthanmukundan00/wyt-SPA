import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import AudioPlayer from './components/AudioPlayer';
import Home from './pages/Home';
import FeedTheMachine from './pages/FeedTheMachine';
import Join from './pages/Join';
import Store from './pages/Store';
import StoreCancel from './pages/StoreCancel';
import StoreSuccess from './pages/StoreSuccess';
import './styles/index.css';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isHomeRoute = location.pathname === '/';

  return (
    <>
      <AudioPlayer />
      <Navbar variant={isHomeRoute ? 'overlay' : 'solid'} />
      <div className={`route-shell ${isHomeRoute ? 'route-shell--overlay' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/machine" element={<FeedTheMachine />} />
          <Route path="/join" element={<Join />} />
          <Route path="/store" element={<Store />} />
          <Route path="/store/success" element={<StoreSuccess />} />
          <Route path="/store/cancel" element={<StoreCancel />} />
        </Routes>
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
};

export default App;
