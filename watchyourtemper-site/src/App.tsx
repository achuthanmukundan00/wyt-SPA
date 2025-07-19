import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AudioPlayer from './components/AudioPlayer';
import Home from './pages/Home';
import FeedTheMachine from './pages/FeedTheMachine';
import Join from './pages/Join';

const App: React.FC = () => {
  return (
    <Router>
      <AudioPlayer />
      <div className="scanlines" />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/machine" element={<FeedTheMachine />} />
        <Route path="/join" element={<Join />} />
      </Routes>
    </Router>
  );
};

export default App;
