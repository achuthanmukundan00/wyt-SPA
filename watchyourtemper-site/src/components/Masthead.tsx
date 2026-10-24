import { Link } from 'react-router-dom';

// The wordmark at the top of every page but home, and the way back to it.
const Masthead: React.FC = () => (
  <header className="masthead">
    <Link to="/" aria-label="watchyourtemper, home">
      <img src="/assets/images/wordmark-transparent.webp" alt="" width="2407" height="498" decoding="async" />
    </Link>
  </header>
);

export default Masthead;
