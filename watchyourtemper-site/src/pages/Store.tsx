import { useEffect, useMemo, useState } from 'react';
import { createCheckoutIntent, fetchStoreProducts } from '../lib/storeApi';
import { getColorOptions, getSelectedVariant as getSelectedVariantByChoice, getSizeOptions } from '../lib/storeSelection';
import type { StoreProduct, StoreVariant } from '../types/store';
import '../styles/index.css';

type SelectionState = {
  color: string;
  size: string;
  quantity: number;
};

const getInitialSelection = (variants: StoreVariant[]): SelectionState => {
  const firstAvailable = variants.find((variant) => variant.availability) || variants[0];
  return {
    color: firstAvailable?.color || 'Default',
    size: firstAvailable?.size || 'Default',
    quantity: 1,
  };
};

const Store: React.FC = () => {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusByProduct, setStatusByProduct] = useState<Record<string, string>>({});
  const [busyByProduct, setBusyByProduct] = useState<Record<string, boolean>>({});
  const [selectionByProduct, setSelectionByProduct] = useState<Record<string, SelectionState>>({});

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
        setSelectionByProduct(
          loaded.reduce<Record<string, SelectionState>>((acc, product) => {
            acc[product.id] = getInitialSelection(product.variants);
            return acc;
          }, {}),
        );
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load products.');
      } finally {
        setLoading(false);
      }
    };

    void loadProducts();
  }, []);

  const getSelectedVariant = (product: StoreProduct): StoreVariant | null => {
    const selection = selectionByProduct[product.id];
    if (!selection) {
      return null;
    }

    return getSelectedVariantByChoice(product.variants, selection.color, selection.size);
  };

  const handleSelectionChange = (product: StoreProduct, next: Partial<SelectionState>) => {
    setSelectionByProduct((current) => {
      const existing = current[product.id] || getInitialSelection(product.variants);
      const draft = { ...existing, ...next };
      const matchingVariant = product.variants.find(
        (variant) => variant.color === draft.color && variant.size === draft.size,
      );

      if (!matchingVariant) {
        const fallbackVariant =
          product.variants.find((variant) => variant.color === draft.color && variant.availability) ||
          product.variants.find((variant) => variant.availability) ||
          product.variants[0];

        return {
          ...current,
          [product.id]: {
            ...draft,
            color: fallbackVariant?.color || draft.color,
            size: fallbackVariant?.size || draft.size,
          },
        };
      }

      return {
        ...current,
        [product.id]: draft,
      };
    });
  };

  const handleCheckout = async (product: StoreProduct) => {
    const selectedVariant = getSelectedVariant(product);
    const selection = selectionByProduct[product.id];

    if (!selectedVariant || !selection) {
      setStatusByProduct((current) => ({ ...current, [product.id]: 'Select an available variant.' }));
      return;
    }

    setBusyByProduct((current) => ({ ...current, [product.id]: true }));
    setStatusByProduct((current) => ({ ...current, [product.id]: '' }));

    try {
      const intent = await createCheckoutIntent({
        productId: product.id,
        variantId: selectedVariant.id,
        quantity: selection.quantity,
      });

      setStatusByProduct((current) => ({
        ...current,
        [product.id]: `Ready for payment: ${intent.lineItem.quantity} x ${intent.lineItem.variantName} (${intent.lineItem.currency} ${intent.lineItem.subtotal.toFixed(2)})`,
      }));
    } catch (checkoutError) {
      setStatusByProduct((current) => ({
        ...current,
        [product.id]: checkoutError instanceof Error ? checkoutError.message : 'Unable to start checkout.',
      }));
    } finally {
      setBusyByProduct((current) => ({ ...current, [product.id]: false }));
    }
  };

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
        {products.map((product, index) => {
          const selection = selectionByProduct[product.id] || getInitialSelection(product.variants);
          const selectedVariant = getSelectedVariant(product);
          const colors = getColorOptions(product.variants);
          const sizes = getSizeOptions(product.variants, selection.color);

          const variantAvailable = Boolean(selectedVariant?.availability);
          const hasImage = Boolean(product.image);

          return (
            <article
              key={product.id}
              className="store-card"
              style={{
                ['--flicker-delay' as string]: `${(index % 4) * 0.08}s`,
                ['--hover-delay' as string]: `${60 + ((index * 17) % 55)}ms`,
              }}
            >
              {hasImage ? (
                <div className="store-image-wrap">
                  <img className="store-image" src={product.image} alt={product.title} />
                </div>
              ) : (
                <div className="store-image-placeholder" aria-label="Product image placeholder">
                  IMAGE COMING SOON
                </div>
              )}

              <div className="store-card-body">
                <h2 className="store-product-name" data-text={product.title}>
                  {product.title}
                </h2>
                <p className="store-product-description">{product.description}</p>
                <p className="store-product-price">
                  {selectedVariant
                    ? `${selectedVariant.currency} ${selectedVariant.price.toFixed(2)}`
                    : 'Price unavailable'}
                </p>

                <div className="store-variant-row">
                  <label>
                    Color
                    <select
                      value={selection.color}
                      onChange={(event) =>
                        handleSelectionChange(product, {
                          color: event.target.value,
                          size: product.variants.find((variant) => variant.color === event.target.value)?.size ||
                            selection.size,
                        })
                      }
                    >
                      {colors.map((color) => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Size
                    <select
                      value={selection.size}
                      onChange={(event) => handleSelectionChange(product, { size: event.target.value })}
                    >
                      {sizes.map((size) => {
                        const optionVariant = product.variants.find(
                          (variant) => variant.color === selection.color && variant.size === size,
                        );
                        return (
                          <option key={size} value={size} disabled={!optionVariant?.availability}>
                            {size}
                            {optionVariant?.availability ? '' : ' (Unavailable)'}
                          </option>
                        );
                      })}
                    </select>
                  </label>

                  <label>
                    Qty
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={selection.quantity}
                      onChange={(event) => {
                        const nextQty = Number(event.target.value);
                        handleSelectionChange(product, {
                          quantity: Number.isInteger(nextQty)
                            ? Math.min(20, Math.max(1, nextQty))
                            : selection.quantity,
                        });
                      }}
                    />
                  </label>
                </div>
              </div>

              <button
                className={`store-buy-btn ${!variantAvailable ? 'disabled' : ''}`}
                type="button"
                disabled={!variantAvailable || busyByProduct[product.id]}
                onClick={() => void handleCheckout(product)}
              >
                <span className="btn-label">
                  {busyByProduct[product.id] ? 'PROCESSING…' : 'START CHECKOUT'}
                </span>
              </button>

              {statusByProduct[product.id] ? (
                <p className="store-intent-status">{statusByProduct[product.id]}</p>
              ) : null}
            </article>
          );
        })}
      </section>
    );
  }, [busyByProduct, error, loading, products, selectionByProduct, statusByProduct]);

  return <main className="store-page">{content}</main>;
};

export default Store;
