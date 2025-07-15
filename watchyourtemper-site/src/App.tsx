import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AudioPlayer from './components/AudioPlayer';
import Home from './pages/Home';
import FeedTheMachine from './pages/FeedTheMachine';

import { useEffect, useState } from 'react';

const GlitchCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updatePos = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', updatePos);
    return () => window.removeEventListener('mousemove', updatePos);
  }, []);

  return (
    <div className="cursor-container" style={{ left: position.x, top: position.y }}>
      <div className="cursor-glitch red" />
      <div className="cursor-glitch cyan" />
    </div>
  );
};


const App: React.FC = () => {
  return (
    <Router>
      <AudioPlayer />
      <div className="scanlines" />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/machine" element={<FeedTheMachine />} />
      </Routes>
      <GlitchCursor />
      <div className="corner-tag bottom-left">
        © 2025 watchyourtemper
      </div>
    </Router>
  );
};

export default App;
