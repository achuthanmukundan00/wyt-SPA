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
        {storeProducts.map((product, index) => {
          const hasImage = Boolean(product.image);
          const canBuy = product.enabled && Boolean(product.stripeUrl);

          return (
            <article
              key={product.id}
              className="store-card"
              style={{
                ['--card-offset' as string]: `${(index % 3) * 10 - 10}px`,
                ['--flicker-delay' as string]: `${(index % 4) * 0.08}s`,
                ['--hover-delay' as string]: `${60 + ((index * 17) % 55)}ms`,
              }}
            >
              {hasImage ? (
                <div className="store-image-wrap">
                  <img className="store-image" src={product.image} alt={product.name} />
                </div>
              ) : (
                <div className="store-image-placeholder" aria-label="Product image placeholder">
                  ADD IMAGE IN /public/assets/images/store/
                </div>
              )}

              <div className="store-card-body">
                <h2 className="store-product-name" data-text={product.name}>
                  {product.name}
                </h2>
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
                  <span className="btn-label">BUY NOW</span>
                </a>
              ) : (
                <button className="store-buy-btn disabled" type="button" disabled>
                  <span className="btn-label">COMING SOON</span>
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
