import { useEffect, useMemo, useState } from 'react';
import CartDrawer from '../components/store/CartDrawer';
import ProductCard from '../components/store/ProductCard';
import ProductOptionsModal from '../components/store/ProductOptionsModal';
import { useCart } from '../context/CartContext';
import { useStorePreferences } from '../context/StorePreferencesContext';
import { createCheckoutStart, fetchShippingQuote, fetchStoreProducts } from '../lib/storeApi';
import type { ChargeSummary, ShippingRateOption, StoreProduct, StoreVariant } from '../types/store';
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
  const [shippingQuoteError, setShippingQuoteError] = useState<string | null>(null);
  const [shippingQuoteLoading, setShippingQuoteLoading] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingRateOption[]>([]);
  const [selectedShippingRateId, setSelectedShippingRateId] = useState('');
  const [chargeSummary, setChargeSummary] = useState<ChargeSummary | null>(null);
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
  const { countries, selectedCountry, selectedCurrency, setSelectedCountry } = useStorePreferences();

  useEffect(() => {
    document.title = 'watchyourtemper | Store';
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      try {
          const loaded = await fetchStoreProducts(selectedCurrency);
          setProducts(loaded);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load products.');
      } finally {
        setLoading(false);
      }
    };

    void loadProducts();
  }, [selectedCurrency]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const id = window.setTimeout(() => setToast(''), 2000);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    setCheckoutForm((current) => (current.country === selectedCountry ? current : { ...current, country: selectedCountry }));
  }, [selectedCountry]);

  useEffect(() => {
    if (!isCheckoutModalOpen || !items.length) {
      setShippingQuoteLoading(false);
      setShippingQuoteError(null);
      setShippingOptions([]);
      setSelectedShippingRateId('');
      setChargeSummary(null);
      return;
    }

    const country = checkoutForm.country.trim().toUpperCase();
    const state = checkoutForm.state.trim().toUpperCase();
    const line1 = checkoutForm.line1.trim();
    const city = checkoutForm.city.trim();
    const postalCode = checkoutForm.postalCode.trim();
    if (!country) {
      setShippingQuoteError('Select a destination country to estimate shipping.');
      setShippingOptions([]);
      setSelectedShippingRateId('');
      setChargeSummary(null);
      return;
    }

    if (['US', 'CA', 'AU'].includes(country) && !state) {
      setShippingQuoteError(`Enter a state or province for ${country} to estimate shipping.`);
      setShippingOptions([]);
      setSelectedShippingRateId('');
      setChargeSummary(null);
      return;
    }

    let active = true;
    const abortController = new AbortController();
    setShippingQuoteLoading(true);
    setShippingQuoteError(null);

    const timeoutId = window.setTimeout(() => {
      void fetchShippingQuote({
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        recipient: {
          name: checkoutForm.name.trim() || undefined,
          line1: line1 || undefined,
          line2: checkoutForm.line2.trim() || undefined,
          city: city || undefined,
          state,
          postalCode: postalCode || undefined,
          country,
        },
        currency: selectedCurrency,
        shippingRateId: selectedShippingRateId || undefined,
      }, { signal: abortController.signal })
        .then((quote) => {
          if (!active) {
            return;
          }

          setShippingOptions(quote.shippingOptions);
          setSelectedShippingRateId(quote.selectedShippingRateId);
          setChargeSummary(quote.chargeSummary);
          if (!quote.chargeSummary) {
            setShippingQuoteError('Enter full shipping details to calculate your final estimated charge.');
          }
        })
        .catch((error) => {
          if (!active) {
            return;
          }

          if (error instanceof Error && error.name === 'AbortError') {
            return;
          }

          const message = error instanceof Error ? error.message : 'Unable to estimate shipping.';
          setShippingQuoteError(message === 'Load failed' ? 'Shipping quote request failed. Please try again in a moment.' : message);
          setShippingOptions([]);
          setSelectedShippingRateId('');
          setChargeSummary(null);
        })
        .finally(() => {
          if (active) {
            setShippingQuoteLoading(false);
          }
        });
    }, 500);

    return () => {
      active = false;
      abortController.abort();
      window.clearTimeout(timeoutId);
    };
  }, [
    checkoutForm.city,
    checkoutForm.country,
    checkoutForm.line1,
    checkoutForm.line2,
    checkoutForm.name,
    checkoutForm.postalCode,
    checkoutForm.state,
    isCheckoutModalOpen,
    items,
    selectedCurrency,
    selectedShippingRateId,
  ]);

  const chargeExtras = useMemo(() => {
    if (!chargeSummary) {
      return 0;
    }

    return chargeSummary.tax + chargeSummary.vat + chargeSummary.digitization + chargeSummary.additionalFee + chargeSummary.fulfillmentFee + chargeSummary.retailDeliveryFee;
  }, [chargeSummary]);

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

    setCheckoutError(null);
    setShippingQuoteError(null);
    setIsCheckoutModalOpen(true);
  };

  const updateCheckoutField = (field: keyof typeof checkoutForm, value: string) => {
    setCheckoutForm((current) => ({ ...current, [field]: value }));
    if (field === 'country') {
      setSelectedCountry(value.toUpperCase());
    }
  };

  const handleCheckoutSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!items.length) {
      setCheckoutError('Your cart is empty.');
      return;
    }

    if (!selectedShippingRateId || !chargeSummary) {
      setCheckoutError('Wait for shipping to be calculated before checkout.');
      return;
    }

    setIsCheckoutSubmitting(true);
    setCheckoutError(null);

    try {
      const { payment } = await createCheckoutStart({
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        customer: {
          email: checkoutForm.email.trim(),
        },
        currency: selectedCurrency,
        shippingAddress: {
          name: checkoutForm.name.trim(),
          line1: checkoutForm.line1.trim(),
          line2: checkoutForm.line2.trim() || undefined,
          city: checkoutForm.city.trim(),
          state: checkoutForm.state.trim(),
          postalCode: checkoutForm.postalCode.trim(),
          country: checkoutForm.country.trim().toUpperCase(),
        },
        shippingRateId: selectedShippingRateId,
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
              {items.length ? (
                <div className="store-checkout-summary">
                  <strong>{items.length === 1 ? items[0].productTitle : `${items.length} items in your cart`}</strong>
                  <div className="store-checkout-lines">
                    {items.map((item) => (
                      <div key={item.key} className="store-checkout-line">
                        <div className="store-checkout-line-copy">
                          <span className="store-checkout-line-title">{item.productTitle}</span>
                          <span className="store-checkout-line-meta">
                            {item.color} • {item.size} • Qty {item.quantity}
                          </span>
                        </div>
                        <span className="store-checkout-line-price">
                          {item.currency} {(item.unitPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="store-checkout-totals">
                    <span className="store-checkout-total-row">
                      <span>Items subtotal</span>
                      <strong>
                        {currency} {subtotal.toFixed(2)}
                      </strong>
                    </span>
                    {shippingQuoteLoading ? <span className="store-checkout-note">Calculating shipping…</span> : null}
                    {shippingQuoteError ? <span className="store-checkout-note store-checkout-note-error">{shippingQuoteError}</span> : null}
                  </div>
                  {shippingOptions.length ? (
                    <label>
                      <span>Shipping option</span>
                      <select
                        value={selectedShippingRateId}
                        onChange={(event) => setSelectedShippingRateId(event.target.value)}
                        disabled={isCheckoutSubmitting}
                      >
                        {shippingOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name} - {option.currency} {option.rate.toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {chargeSummary ? (
                    <div className="store-checkout-totals">
                      <span className="store-checkout-total-row">
                        <span>Items subtotal</span>
                        <strong>
                          {chargeSummary.currency} {chargeSummary.itemSubtotal.toFixed(2)}
                        </strong>
                      </span>
                      <span className="store-checkout-total-row">
                        <span>Shipping</span>
                        <strong>
                          {chargeSummary.currency} {chargeSummary.shipping.toFixed(2)}
                        </strong>
                      </span>
                      {chargeExtras > 0 ? (
                        <span className="store-checkout-total-row">
                          <span>Taxes & fees</span>
                          <strong>
                            {chargeSummary.currency} {chargeExtras.toFixed(2)}
                          </strong>
                        </span>
                      ) : null}
                      <span className="store-checkout-total-row store-checkout-total-row-strong">
                        <span>Estimated charge</span>
                        <strong>
                          {chargeSummary.currency} {chargeSummary.total.toFixed(2)}
                        </strong>
                      </span>
                      {selectedCurrency !== chargeSummary.currency ? (
                        <span className="store-checkout-note">
                          Shipping quotes use {selectedCurrency}, but final checkout charges in {chargeSummary.currency}.
                        </span>
                      ) : null}
                    </div>
                  ) : shippingOptions.length && !shippingQuoteLoading ? (
                    <div className="store-checkout-totals">
                      <span className="store-checkout-note">
                        Select a shipping option now. Enter full shipping details to calculate your final estimated charge.
                      </span>
                    </div>
                  ) : null}
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
                    <span>Country</span>
                    <select
                      value={checkoutForm.country}
                      onChange={(event) => updateCheckoutField('country', event.target.value)}
                      required
                    >
                      <option value="" disabled>
                        Select country
                      </option>
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
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
