import { useEffect, useMemo, useState } from 'react';
import CartDrawer from '../components/store/CartDrawer';
import ProductCard from '../components/store/ProductCard';
import ProductOptionsModal from '../components/store/ProductOptionsModal';
import { useCart } from '../context/CartContext';
import { fetchStoreProducts } from '../lib/storeApi';
import type { StoreProduct, StoreVariant } from '../types/store';
import '../styles/index.css';

const Store: React.FC = () => {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeProduct, setActiveProduct] = useState<StoreProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState('');

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

  return (
    <main className="store-page">
      <header className="store-toolbar">
        <p>APPAREL RITUALS</p>
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
        onClose={() => setIsCartOpen(false)}
        onRemove={removeItem}
        onUpdateQuantity={updateQuantity}
      />

      {toast ? <div className="store-toast">{toast}</div> : null}
    </main>
  );
};

export default Store;
