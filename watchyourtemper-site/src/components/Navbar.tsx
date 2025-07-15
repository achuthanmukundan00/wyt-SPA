import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/index.css";

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="nav-top">
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
        <a href="https://dashboard.mailerlite.com/forms/1434970/150992102536250799/share"
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
        <Link to="/">home</Link>
        <Link to="/machine">machine</Link>
      </div>
    </div>
  );
};

export default Navbar;
