import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Masthead from '../components/Masthead';
import SiteFooter from '../components/SiteFooter';
import { CART_STORAGE_KEY } from '../context/CartContext';

const StoreSuccess: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  return (
    <main className="site store-page store-status-page">
      <Masthead />
      <div className="content">
      <section className="store-status-card">
        <p className="store-status-eyebrow">Payment Received</p>
        <h1>Order locked in.</h1>
        <p>Your payment went through and the fulfillment flow has been handed off. You can head back to the store or keep exploring.</p>
        <Link className="text-link store-status-link" to="/store">
          Return to store
        </Link>
      </section>
      </div>
      <SiteFooter />
    </main>
  );
};

export default StoreSuccess;
