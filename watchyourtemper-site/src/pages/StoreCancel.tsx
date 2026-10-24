import { Link } from 'react-router-dom';
import Masthead from '../components/Masthead';
import SiteFooter from '../components/SiteFooter';

const StoreCancel: React.FC = () => {
  return (
    <main className="site store-page store-status-page">
      <Masthead />
      <div className="content">
      <section className="store-status-card">
        <p className="store-status-eyebrow">Checkout Cancelled</p>
        <h1>Your cart is still waiting.</h1>
        <p>No charge was completed. You can head back to the store and try checkout again whenever you&apos;re ready.</p>
        <Link className="text-link store-status-link" to="/store">
          Back to store
        </Link>
      </section>
      </div>
      <SiteFooter />
    </main>
  );
};

export default StoreCancel;
