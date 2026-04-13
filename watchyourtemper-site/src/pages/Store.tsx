import { useEffect } from 'react';
import { storeProducts } from '../data/storeProducts';
import '../styles/index.css';

const Store: React.FC = () => {
  useEffect(() => {
    document.title = 'watchyourtemper | Store';
  }, []);

  return (
    <main className="store-page">
      <section className="store-grid" aria-label="Store products">
        {storeProducts.map((product) => {
          const hasImage = Boolean(product.image);
          const canBuy = product.enabled && Boolean(product.stripeUrl);

          return (
            <article key={product.id} className="store-card">
              {hasImage ? (
                <img className="store-image" src={product.image} alt={product.name} />
              ) : (
                <div className="store-image-placeholder" aria-label="Product image placeholder">
                  ADD IMAGE IN /public/assets/images/store/
                </div>
              )}

              <div className="store-card-body">
                <h2 className="store-product-name">{product.name}</h2>
                <p className="store-product-description">{product.description}</p>
                {product.variant ? <p className="store-product-variant">{product.variant}</p> : null}
                <p className="store-product-price">{product.price}</p>
              </div>

              {canBuy ? (
                <a
                  href={product.stripeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-buy-btn"
                >
                  Buy now
                </a>
              ) : (
                <button className="store-buy-btn disabled" type="button" disabled>
                  Coming soon
                </button>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
};

export default Store;
