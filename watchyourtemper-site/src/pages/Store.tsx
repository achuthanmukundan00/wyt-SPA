import { useEffect, useMemo, useState } from 'react';
import CartDrawer from '../components/store/CartDrawer';
import ProductCard from '../components/store/ProductCard';
import ProductOptionsModal from '../components/store/ProductOptionsModal';
import { useCart } from '../context/CartContext';
import { createCheckoutStart, fetchStoreProducts } from '../lib/storeApi';
import type { StoreProduct, StoreVariant } from '../types/store';
import '../styles/index.css';

const Store: React.FC = () => {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeProduct, setActiveProduct] = useState<StoreProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isCheckoutSubmitting, setIsCheckoutSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [checkoutForm, setCheckoutForm] = useState({
    email: '',
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  });

  const { items, subtotal, totalQuantity, currency, addItem, removeItem, updateQuantity } = useCart();

  useEffect(() => {
    document.title = 'watchyourtemper | Store';
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const loaded = await fetchStoreProducts();
        setProducts(loaded);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load products.');
      } finally {
        setLoading(false);
      }
    };

    void loadProducts();
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const id = window.setTimeout(() => setToast(''), 2000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const content = useMemo(() => {
    if (loading) {
      return <p className="store-state">LOADING MERCH…</p>;
    }

    if (error) {
      return <p className="store-state store-state-error">{error}</p>;
    }

    if (!products.length) {
      return <p className="store-state">NO PRODUCTS AVAILABLE.</p>;
    }

    return (
      <section className="store-grid" aria-label="Store products">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onSelect={(selected) => {
              setActiveProduct(selected);
              setIsModalOpen(true);
            }}
          />
        ))}
      </section>
    );
  }, [error, loading, products]);

  const handleAddToCart = (product: StoreProduct, variant: StoreVariant, quantity: number) => {
    addItem({ product, variant, quantity });
    setToast('Added to cart');
    setIsCartOpen(true);
  };

  const handleCheckout = () => {
    if (!items.length) {
      setToast('Your cart is empty.');
      return;
    }

    if (items.length > 1) {
      setToast('Checkout currently supports one cart item at a time.');
      return;
    }

    setCheckoutError(null);
    setIsCheckoutModalOpen(true);
  };

  const updateCheckoutField = (field: keyof typeof checkoutForm, value: string) => {
    setCheckoutForm((current) => ({ ...current, [field]: value }));
  };

  const handleCheckoutSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const [item] = items;
    if (!item) {
      setCheckoutError('Your cart is empty.');
      return;
    }

    setIsCheckoutSubmitting(true);
    setCheckoutError(null);

    try {
      const { payment } = await createCheckoutStart({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        customer: {
          email: checkoutForm.email.trim(),
        },
        shippingAddress: {
          name: checkoutForm.name.trim(),
          line1: checkoutForm.line1.trim(),
          line2: checkoutForm.line2.trim() || undefined,
          city: checkoutForm.city.trim(),
          state: checkoutForm.state.trim(),
          postalCode: checkoutForm.postalCode.trim(),
          country: checkoutForm.country.trim().toUpperCase(),
        },
      });

      window.location.assign(payment.checkoutUrl);
    } catch (submitError) {
      setCheckoutError(submitError instanceof Error ? submitError.message : 'Unable to start checkout.');
      setIsCheckoutSubmitting(false);
    }
  };

  return (
    <main className="store-page">
      <header className="store-toolbar">
        <p>OFFICIAL MERCH</p>
        <button className="store-cart-open-btn" type="button" onClick={() => setIsCartOpen(true)}>
          Cart ({totalQuantity})
        </button>
      </header>

      {content}

      <ProductOptionsModal
        product={activeProduct}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        open={isCartOpen}
        items={items}
        subtotal={subtotal}
        totalQuantity={totalQuantity}
        currency={currency}
        checkoutDisabled={!items.length}
        onClose={() => setIsCartOpen(false)}
        onCheckout={handleCheckout}
        onRemove={removeItem}
        onUpdateQuantity={updateQuantity}
      />

      {isCheckoutModalOpen ? (
        <div className="store-modal-backdrop" role="presentation" onClick={() => !isCheckoutSubmitting && setIsCheckoutModalOpen(false)}>
          <section
            className="store-modal store-checkout-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Checkout details"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="store-modal-close"
              type="button"
              aria-label="Close checkout"
              onClick={() => setIsCheckoutModalOpen(false)}
              disabled={isCheckoutSubmitting}
            >
              ×
            </button>

            <div className="store-checkout-panel">
              <h3>Checkout</h3>
              <p className="store-modal-description">Enter your shipping details and we&apos;ll send you to Stripe to complete payment.</p>
              {items[0] ? (
                <div className="store-checkout-summary">
                  <strong>{items[0].productTitle}</strong>
                  <span>
                    {items[0].color} • {items[0].size} • Qty {items[0].quantity}
                  </span>
                  <span>
                    {items[0].currency} {(items[0].unitPrice * items[0].quantity).toFixed(2)}
                  </span>
                </div>
              ) : null}

              <form className="store-checkout-form" onSubmit={handleCheckoutSubmit}>
                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={checkoutForm.email}
                    onChange={(event) => updateCheckoutField('email', event.target.value)}
                    autoComplete="email"
                    required
                  />
                </label>
                <label>
                  <span>Full name</span>
                  <input
                    type="text"
                    value={checkoutForm.name}
                    onChange={(event) => updateCheckoutField('name', event.target.value)}
                    autoComplete="name"
                    required
                  />
                </label>
                <label>
                  <span>Address line 1</span>
                  <input
                    type="text"
                    value={checkoutForm.line1}
                    onChange={(event) => updateCheckoutField('line1', event.target.value)}
                    autoComplete="address-line1"
                    required
                  />
                </label>
                <label>
                  <span>Address line 2</span>
                  <input
                    type="text"
                    value={checkoutForm.line2}
                    onChange={(event) => updateCheckoutField('line2', event.target.value)}
                    autoComplete="address-line2"
                  />
                </label>
                <div className="store-checkout-grid">
                  <label>
                    <span>City</span>
                    <input
                      type="text"
                      value={checkoutForm.city}
                      onChange={(event) => updateCheckoutField('city', event.target.value)}
                      autoComplete="address-level2"
                      required
                    />
                  </label>
                  <label>
                    <span>State / province</span>
                    <input
                      type="text"
                      value={checkoutForm.state}
                      onChange={(event) => updateCheckoutField('state', event.target.value)}
                      autoComplete="address-level1"
                      required
                    />
                  </label>
                </div>
                <div className="store-checkout-grid">
                  <label>
                    <span>Postal code</span>
                    <input
                      type="text"
                      value={checkoutForm.postalCode}
                      onChange={(event) => updateCheckoutField('postalCode', event.target.value)}
                      autoComplete="postal-code"
                      required
                    />
                  </label>
                  <label>
                    <span>Country code</span>
                    <input
                      type="text"
                      value={checkoutForm.country}
                      onChange={(event) => updateCheckoutField('country', event.target.value)}
                      autoComplete="country"
                      maxLength={2}
                      placeholder="US"
                      required
                    />
                  </label>
                </div>

                {checkoutError ? <p className="store-checkout-error">{checkoutError}</p> : null}

                <button className="store-checkout-btn" type="submit" disabled={isCheckoutSubmitting}>
                  {isCheckoutSubmitting ? 'Redirecting…' : 'Continue to payment'}
                </button>
              </form>
            </div>
          </section>
        </div>
      ) : null}

      {toast ? <div className="store-toast">{toast}</div> : null}
    </main>
  );
};

export default Store;
