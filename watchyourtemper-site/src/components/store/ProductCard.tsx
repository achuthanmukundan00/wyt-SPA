import React from 'react';
import type { StoreProduct } from '../../types/store';

type Props = {
  product: StoreProduct;
  onSelect: (product: StoreProduct) => void;
};

const ProductCard: React.FC<Props> = ({ product, onSelect }) => {
  const prices = product.variants.map((variant) => variant.price).filter((price) => Number.isFinite(price));
  const minPrice = prices.length ? Math.min(...prices) : 0;

  return (
    <article className="store-card" aria-label={product.title}>
      {product.image ? (
        <div className="store-image-wrap">
          <img className="store-image" src={product.image} alt={product.title} loading="lazy" />
        </div>
      ) : (
        <div className="store-image-placeholder">IMAGE COMING SOON</div>
      )}

      <div className="store-card-body">
        <h2 className="store-product-name">{product.title}</h2>
        <p className="store-product-description">{product.description}</p>
        <p className="store-product-price">From {product.variants[0]?.currency || 'USD'} {minPrice.toFixed(2)}</p>
      </div>

      <button className="store-buy-btn" type="button" onClick={() => onSelect(product)}>
        <span className="btn-label">Select options</span>
      </button>
    </article>
  );
};

export default ProductCard;
