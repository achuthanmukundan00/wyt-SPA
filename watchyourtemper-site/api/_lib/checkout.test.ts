import { describe, expect, test } from 'vitest';
import { parseCheckoutInput } from './checkout';

describe('parseCheckoutInput', () => {
  test('accepts a valid payload', () => {
    expect(
      parseCheckoutInput({
        productId: 'prod_123',
        variantId: 'var_123',
        quantity: 2,
      }),
    ).toEqual({
      productId: 'prod_123',
      variantId: 'var_123',
      quantity: 2,
    });
  });

  test('rejects missing variantId', () => {
    expect(() => parseCheckoutInput({ productId: 'p', quantity: 1 })).toThrow('variantId is required.');
  });

  test('rejects invalid quantity', () => {
    expect(() => parseCheckoutInput({ productId: 'p', variantId: 'v', quantity: 0 })).toThrow(
      'quantity must be an integer between 1 and 20.',
    );
  });
});
