import React from 'react';
import type { CartLineItem } from '../../context/CartContext';
import QuantitySelector from './QuantitySelector';

type Props = {
  open: boolean;
  items: CartLineItem[];
  subtotal: number;
  totalQuantity: number;
  currency: string;
  onClose: () => void;
  onRemove: (lineKey: string) => void;
  onUpdateQuantity: (lineKey: string, quantity: number) => void;
};

const CartDrawer: React.FC<Props> = ({
  open,
  items,
  subtotal,
  totalQuantity,
  currency,
  onClose,
  onRemove,
  onUpdateQuantity,
}) => {
  return (
    <>
      <div className={`store-cart-backdrop ${open ? 'is-open' : ''}`} onClick={onClose} />
      <aside className={`store-cart ${open ? 'is-open' : ''}`} aria-label="Shopping cart">
        <header>
          <h3>Cart ({totalQuantity})</h3>
          <button type="button" onClick={onClose} aria-label="Close cart">
            ×
          </button>
        </header>

        {!items.length ? (
          <p className="store-state">Your cart is empty.</p>
        ) : (
          <div className="store-cart-list">
            {items.map((item) => (
              <article key={item.key} className="store-cart-line">
                {item.productImage ? <img src={item.productImage} alt={item.productTitle} /> : <div className="store-image-placeholder">IMAGE</div>}
                <div className="store-cart-line-body">
                  <h4>{item.productTitle}</h4>
                  <p>{item.color} • {item.size}</p>
                  <p>{item.currency} {item.unitPrice.toFixed(2)} each</p>
                  <QuantitySelector value={item.quantity} onChange={(qty) => onUpdateQuantity(item.key, qty)} />
                  <button type="button" className="store-text-link" onClick={() => onRemove(item.key)}>
                    Remove
                  </button>
                </div>
                <p className="store-cart-line-total">{item.currency} {(item.unitPrice * item.quantity).toFixed(2)}</p>
              </article>
            ))}
          </div>
        )}

        <footer>
          <p>Subtotal</p>
          <strong>{currency} {subtotal.toFixed(2)}</strong>
        </footer>
      </aside>
    </>
  );
};

export default CartDrawer;
