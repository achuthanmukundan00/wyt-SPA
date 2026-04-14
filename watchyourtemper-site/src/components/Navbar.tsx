import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStorePreferences } from '../context/StorePreferencesContext';
import '../styles/index.css';

type NavbarVariant = 'overlay' | 'solid';

interface NavbarProps {
  variant: NavbarVariant;
}

const Navbar: React.FC<NavbarProps> = ({ variant }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const showStorePreferences = location.pathname.startsWith('/store');
  const {
    countries,
    currencies,
    selectedCountry,
    selectedCurrency,
    setSelectedCountry,
    setSelectedCurrency,
  } = useStorePreferences();

  return (
    <nav className={`nav-top ${variant === 'solid' ? 'nav-solid' : ''}`}>
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
        {showStorePreferences ? (
          <div className="nav-store-prefs">
            <label className="nav-select-wrap" aria-label="Store country">
              <span className="nav-select-label">Ship to</span>
              <select value={selectedCountry} onChange={(event) => setSelectedCountry(event.target.value)}>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="nav-select-wrap" aria-label="Store currency">
              <span className="nav-select-label">Currency</span>
              <select value={selectedCurrency} onChange={(event) => setSelectedCurrency(event.target.value)}>
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
        <Link to="/store">STORE</Link>
        <a href="/join" target="_blank" rel="noopener noreferrer">
          JOIN
        </a>
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
      <button
        className={`burger ${menuOpen ? 'is-open' : ''}`}
        type="button"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span />
        <span />
        <span />
      </button>
      <div className={`mobile-menu ${menuOpen ? 'show' : ''}`}>
        {showStorePreferences ? (
          <>
            <label className="nav-select-wrap mobile-pref" aria-label="Mobile store country">
              <span className="nav-select-label">Ship to</span>
              <select value={selectedCountry} onChange={(event) => setSelectedCountry(event.target.value)}>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="nav-select-wrap mobile-pref" aria-label="Mobile store currency">
              <span className="nav-select-label">Currency</span>
              <select value={selectedCurrency} onChange={(event) => setSelectedCurrency(event.target.value)}>
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}
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
