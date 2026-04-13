import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/index.css";

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  return (
    <nav className={`nav-top ${!isHome ? "nav-solid" : ""}`}>
      <div className="nav-left">
        <Link to="/">
          <img
            src="/assets/images/logo.png"
            alt="watchyourtemper"
            className="nav-logo"
          />
        </Link>
      </div>
      <div className="nav-right">
        <Link to="/store">STORE</Link>
        <a href="/join"
           target="_blank"
           rel="noopener noreferrer"
           >JOIN</a>
        <a
          href="https://www.instagram.com/watchyourtemper/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src="/icons/instagram.svg" alt="IG" className="social-icon" />
        </a>
        <a
          href="https://www.tiktok.com/@watchyourtemper"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src="/icons/tiktok.svg" alt="TikTok" className="social-icon" />
        </a>
        <a
          href="https://www.youtube.com/@watchyourtemper"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src="/icons/youtube.svg" alt="YT" className="social-icon" />
        </a>
        <a
          href="https://soundcloud.com/watchyourtemper"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src="/icons/soundcloud.svg" alt="SC" className="social-icon" />
        </a>
      </div>
      <button className="burger" onClick={() => setMenuOpen(!menuOpen)}>
        <span />
        <span />
        <span />
      </button>
      <div className={`mobile-menu ${menuOpen ? "show" : ""}`}>
        <Link to="/" onClick={() => setMenuOpen(false)}>
          home
        </Link>
        <Link to="/machine" onClick={() => setMenuOpen(false)}>
          machine
        </Link>
        <Link to="/store" onClick={() => setMenuOpen(false)}>
          store
        </Link>
        <Link to="/join" onClick={() => setMenuOpen(false)}>
          join
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
