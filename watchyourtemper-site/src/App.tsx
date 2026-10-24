import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import SignalScreen from './components/SignalScreen';
import Home from './pages/Home';
import FeedTheMachine from './pages/FeedTheMachine';
import Join from './pages/Join';
import Store from './pages/Store';
import StoreCancel from './pages/StoreCancel';
import StoreSuccess from './pages/StoreSuccess';
import './styles/site.css';

// A new page starts at its top, unless the link names a place on it.
const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
};

const App: React.FC = () => (
  <Router>
    <ScrollToTop />
    <SignalScreen />
    <div className="crt-raster" aria-hidden="true" />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/machine" element={<FeedTheMachine />} />
      <Route path="/join" element={<Join />} />
      <Route path="/store" element={<Store />} />
      <Route path="/store/success" element={<StoreSuccess />} />
      <Route path="/store/cancel" element={<StoreCancel />} />
    </Routes>
  </Router>
);

export default App;
