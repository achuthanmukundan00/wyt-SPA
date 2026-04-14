import { useEffect, useMemo, useState } from 'react';
import type { StoreProduct, StoreVariant } from '../../types/store';
import QuantitySelector from './QuantitySelector';

type Props = {
  product: StoreProduct | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (product: StoreProduct, variant: StoreVariant, quantity: number) => void;
};

const getFirstAvailableVariant = (product: StoreProduct | null) =>
  product?.variants.find((variant) => variant.availability) || product?.variants[0] || null;

const ProductOptionsModal: React.FC<Props> = ({ product, open, onClose, onAddToCart }) => {
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!open || !product) {
      return;
    }

    const first = getFirstAvailableVariant(product);
    if (first) {
      setColor(first.color);
      setSize(first.size);
    }
    setQuantity(1);
  }, [open, product]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const variantsByColor = useMemo(() => {
    if (!product) {
      return new Map<string, StoreVariant[]>();
    }

    return product.variants.reduce((acc, variant) => {
      const list = acc.get(variant.color) || [];
      list.push(variant);
      acc.set(variant.color, list);
      return acc;
    }, new Map<string, StoreVariant[]>());
  }, [product]);

  const colors = useMemo(() => [...variantsByColor.keys()], [variantsByColor]);

  const sizes = useMemo(() => {
    if (!product) {
      return [] as string[];
    }

    return [...new Set(product.variants.map((variant) => variant.size))];
  }, [product]);

  const selectedVariant = useMemo(() => {
    if (!product) {
      return null;
    }

    return product.variants.find((variant) => variant.color === color && variant.size === size) || null;
  }, [color, product, size]);

  if (!open || !product) {
    return null;
  }

  return (
    <div className="store-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="store-modal" role="dialog" aria-modal="true" aria-label={`Select options for ${product.title}`} onClick={(event) => event.stopPropagation()}>
        <button className="store-modal-close" type="button" aria-label="Close options" onClick={onClose}>
          ×
        </button>

        <div className="store-modal-media">
          {product.image ? <img src={product.image} alt={product.title} /> : <div className="store-image-placeholder">IMAGE COMING SOON</div>}
        </div>

        <div className="store-modal-body">
          <h3>{product.title}</h3>
          <p className="store-modal-price">
            {selectedVariant ? `${selectedVariant.currency} ${selectedVariant.price.toFixed(2)}` : 'Select options'}
          </p>
          <p className="store-modal-description">{product.description}</p>

          <div className="store-option-group">
            <p>Color</p>
            <div className="store-option-row">
              {colors.map((optionColor) => {
                const hasAvailable = (variantsByColor.get(optionColor) || []).some((variant) => variant.availability);
                return (
                  <button
                    key={optionColor}
                    type="button"
                    className={`store-option-pill ${color === optionColor ? 'is-selected' : ''}`}
                    disabled={!hasAvailable}
                    onClick={() => {
                      setColor(optionColor);
                      const matching = (variantsByColor.get(optionColor) || []).find((variant) => variant.availability);
                      if (matching) {
                        setSize(matching.size);
                      }
                    }}
                  >
                    {optionColor}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="store-option-group">
            <p>Size</p>
            <div className="store-option-row">
              {sizes.map((optionSize) => {
                const variant = product.variants.find((item) => item.color === color && item.size === optionSize);
                return (
                  <button
                    key={optionSize}
                    type="button"
                    className={`store-option-pill ${size === optionSize ? 'is-selected' : ''}`}
                    disabled={!variant?.availability}
                    onClick={() => setSize(optionSize)}
                  >
                    {optionSize}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="store-option-group">
            <p>Quantity</p>
            <QuantitySelector value={quantity} onChange={setQuantity} />
          </div>

          <button
            className="store-buy-btn"
            type="button"
            disabled={!selectedVariant || !selectedVariant.availability}
            onClick={() => {
              if (!selectedVariant || !selectedVariant.availability) {
                return;
              }

              onAddToCart(product, selectedVariant, quantity);
              onClose();
            }}
          >
            <span className="btn-label">Add to cart</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default ProductOptionsModal;
