import { Link } from 'react-router-dom';

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;

// Who made it, then where to find the rest. The site has no navbar: its links
// live here and in the page.
const SiteFooter: React.FC = () => (
  <footer className="site-footer">
    <p>Made with 🖤 in Toronto, Ontario, Canada</p>
    <p>watchyourtemper</p>
    <div className="site-footer__links">
      <Link to="/store">Store</Link>
      <a href="/join" {...external}>Mailing list&nbsp;↗<span className="sr-only"> (opens in a new tab)</span></a>
      <a href="https://www.instagram.com/watchyourtemper/" {...external}>Instagram&nbsp;↗<span className="sr-only"> (opens in a new tab)</span></a>
      <a href="/pressure-test/">PRESSURE TEST&nbsp;↗</a>
    </div>
  </footer>
);

export default SiteFooter;
