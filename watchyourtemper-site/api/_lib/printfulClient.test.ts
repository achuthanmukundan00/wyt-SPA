import { describe, expect, test } from 'vitest';
import { normalizeStoreProduct } from './printfulClient';

describe('normalizeStoreProduct', () => {
  test('maps sync product and variants into storefront shape', () => {
    const normalized = normalizeStoreProduct({
      sync_product: {
        id: 44,
        name: 'Pressure Test Tee',
        thumbnail_url: 'https://cdn.example/thumb.png',
      },
      sync_variants: [
        {
          id: 100,
          name: 'Black / M',
          retail_price: '25.50',
          currency: 'USD',
        },
      ],
    });

    expect(normalized).toEqual({
      id: '44',
      slug: 'pressure-test-tee',
      title: 'Pressure Test Tee',
      description: 'Official watchyourtemper merch item.',
      image: 'https://cdn.example/thumb.png',
      variants: [
        {
          id: '100',
          name: 'Black / M',
          size: 'M',
          color: 'Black',
          price: 25.5,
          currency: 'USD',
          availability: true,
        },
      ],
    });
  });

  test('marks ignored or discontinued variants unavailable', () => {
    const normalized = normalizeStoreProduct({
      sync_product: {
        id: 45,
        name: 'Tote',
      },
      sync_variants: [
        {
          id: 101,
          name: 'Natural / One Size',
          retail_price: '20.00',
          is_ignored: true,
        },
      ],
    });

    expect(normalized.variants[0].availability).toBe(false);
  });
});
