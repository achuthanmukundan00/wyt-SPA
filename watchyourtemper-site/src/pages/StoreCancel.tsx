import { Link } from 'react-router-dom';
import '../styles/index.css';

const StoreCancel: React.FC = () => {
  return (
    <main className="store-page store-status-page">
      <section className="store-status-card">
        <p className="store-status-eyebrow">Checkout Cancelled</p>
        <h1>Your cart is still waiting.</h1>
        <p>No charge was completed. You can head back to the store and try checkout again whenever you&apos;re ready.</p>
        <Link className="store-checkout-btn store-status-link" to="/store">
          Back to store
        </Link>
      </section>
    </main>
  );
};

export default StoreCancel;
