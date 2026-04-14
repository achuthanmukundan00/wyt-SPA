import { describe, expect, test } from 'vitest';
import { parseCheckoutInput, parseCheckoutStartInput } from './checkout';

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


describe('parseCheckoutStartInput', () => {
  test('accepts a valid payload with customer and shipping', () => {
    expect(
      parseCheckoutStartInput({
        productId: 'prod_123',
        variantId: 'var_123',
        quantity: 2,
        customer: { email: 'fan@example.com' },
        shippingAddress: {
          name: 'Ava Fan',
          line1: '123 Ritual Ave',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90001',
          country: 'US',
        },
      }),
    ).toMatchObject({
      productId: 'prod_123',
      variantId: 'var_123',
      quantity: 2,
      customer: { email: 'fan@example.com' },
    });
  });

  test('rejects missing customer email', () => {
    expect(() =>
      parseCheckoutStartInput({
        productId: 'prod_123',
        variantId: 'var_123',
        quantity: 2,
        customer: {},
        shippingAddress: {
          name: 'Ava Fan',
          line1: '123 Ritual Ave',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90001',
          country: 'US',
        },
      }),
    ).toThrow('customer.email is required.');
  });
});
