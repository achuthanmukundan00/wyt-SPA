import { describe, expect, test } from 'vitest';
import { __testables } from './worker';

describe('worker helpers', () => {
  test('accepts a valid multi-item checkout payload', () => {
    expect(
      __testables.parseCheckoutStartInput({
        items: [
          { productId: 'prod_1', variantId: 'var_1', quantity: 2 },
          { productId: 'prod_2', variantId: 'var_2', quantity: 1 },
        ],
        customer: { email: 'fan@example.com' },
        currency: 'eur',
        shippingAddress: {
          name: 'Ava Fan',
          line1: '123 Ritual Ave',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90001',
          country: 'us',
        },
      }),
    ).toMatchObject({
      customer: { email: 'fan@example.com' },
      currency: 'EUR',
      items: [
        { productId: 'prod_1', variantId: 'var_1', quantity: 2 },
        { productId: 'prod_2', variantId: 'var_2', quantity: 1 },
      ],
      shippingAddress: { country: 'US' },
    });
  });

  test('rejects an empty cart payload', () => {
    expect(() =>
      __testables.parseCheckoutStartInput({
        items: [],
        customer: { email: 'fan@example.com' },
        currency: 'eur',
        shippingAddress: {
          name: 'Ava Fan',
          line1: '123 Ritual Ave',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90001',
          country: 'US',
        },
      }),
    ).toThrow('items must contain at least one cart line.');
  });

  test('builds multiple Stripe line items', () => {
    const params = __testables.buildStripeCheckoutBody(
      {
        intentId: 'intent_123',
        status: 'requires_payment',
        items: [
          {
            productId: 'prod_1',
            productTitle: 'Pressure Test Tee',
            productImage: '',
            variantId: '100',
            variantName: 'Black / M',
            size: 'M',
            color: 'Black',
            basePrice: 25.5,
            baseCurrency: 'USD',
            unitPrice: 25.5,
            currency: 'USD',
            quantity: 2,
            subtotal: 51,
          },
          {
            productId: 'prod_2',
            productTitle: 'Tote',
            productImage: '',
            variantId: '101',
            variantName: 'Natural / One Size',
            size: 'One Size',
            color: 'Natural',
            basePrice: 20,
            baseCurrency: 'USD',
            unitPrice: 20,
            currency: 'USD',
            quantity: 1,
            subtotal: 20,
          },
        ],
        totals: {
          currency: 'USD',
          subtotal: 71,
          quantity: 3,
        },
        message: '',
      },
      'fan@example.com',
      'https://watchyourtemper.com',
      {
        currency: 'USD',
        itemSubtotal: 71,
        shipping: 9.5,
        tax: 3.2,
        vat: 0,
        digitization: 0,
        additionalFee: 0,
        fulfillmentFee: 0,
        retailDeliveryFee: 0,
        total: 83.7,
      },
      'STANDARD',
    );

    expect(params.get('line_items[0][quantity]')).toBe('2');
    expect(params.get('line_items[1][quantity]')).toBe('1');
    expect(params.get('metadata[itemCount]')).toBe('2');
    expect(params.get('line_items[2][price_data][product_data][name]')).toContain('Shipping');
  });

  test('order confirmation email renders all items', () => {
    const email = __testables.buildOrderConfirmationEmail({
      intentId: 'intent_123',
      status: 'order_created',
      items: [
        {
          productId: 'prod_1',
          productTitle: 'Pressure Test Tee',
          productImage: '',
          variantId: '100',
          variantName: 'Black / M',
          size: 'M',
          color: 'Black',
          basePrice: 25.5,
          baseCurrency: 'USD',
          unitPrice: 25.5,
          currency: 'USD',
          quantity: 2,
          subtotal: 51,
        },
        {
          productId: 'prod_2',
          productTitle: 'Tote',
          productImage: '',
          variantId: '101',
          variantName: 'Natural / One Size',
          size: 'One Size',
          color: 'Natural',
          basePrice: 20,
          baseCurrency: 'USD',
          unitPrice: 20,
          currency: 'USD',
          quantity: 1,
          subtotal: 20,
        },
      ],
      totals: {
        currency: 'USD',
        subtotal: 71,
        quantity: 3,
      },
      shipping: {
        name: 'Ava Fan',
        line1: '123 Ritual Ave',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'US',
      },
      customerEmail: 'fan@example.com',
      paymentProvider: 'stripe',
      paymentReferenceId: 'cs_123',
      paymentCheckoutUrl: 'https://checkout.stripe.com/pay/cs_123',
      idempotencyKey: 'idem_123',
      shippingRateId: 'STANDARD',
      shippingRateName: 'Flat Rate',
      chargeSummary: {
        currency: 'USD',
        itemSubtotal: 71,
        shipping: 9.5,
        tax: 3.2,
        vat: 0,
        digitization: 0,
        additionalFee: 0,
        fulfillmentFee: 0,
        retailDeliveryFee: 0,
        total: 83.7,
      },
      createdAt: '2026-04-14T00:00:00.000Z',
      updatedAt: '2026-04-14T00:00:00.000Z',
      printfulOrderId: '9988',
    });

    expect(email.subject).toContain('2 items');
    expect(email.text).toContain('Pressure Test Tee - Black / M x2');
    expect(email.text).toContain('Tote - Natural / One Size x1');
  });

  test('printful event ids are stable for the same body', async () => {
    const body = JSON.stringify({
      data: {
        order: { external_id: 'intent_123', status: 'shipped' },
      },
    });

    await expect(__testables.buildPrintfulWebhookEventId(body)).resolves.toBe(
      await __testables.buildPrintfulWebhookEventId(body),
    );
  });

  test('sanitizes printful external ids from checkout intent ids', () => {
    expect(__testables.buildPrintfulExternalId('9ccbb1a8-8705-41ab-ac4a-349913904dab')).toBe(
      'wyt9ccbb1a8870541abac4a349913904dab',
    );
  });

  test('status progression does not regress from shipped back to in production', () => {
    expect(__testables.resolveNextStatus('shipped', 'in_production')).toBe('shipped');
    expect(__testables.resolveNextStatus('order_created', 'shipped')).toBe('shipped');
  });

  test('shipping quote input requires state for the US', () => {
    expect(() =>
      __testables.parseShippingQuoteInput({
        items: [{ productId: 'prod_1', variantId: 'var_1', quantity: 1 }],
        recipient: {
          country: 'US',
        },
      }),
    ).toThrow('recipient.state is required for US.');
  });

  test('defaults currencies from common countries', () => {
    expect(__testables.defaultCurrencyForCountry('CA')).toBe('CAD');
    expect(__testables.defaultCurrencyForCountry('DE')).toBe('EUR');
    expect(__testables.defaultCurrencyForCountry('XX')).toBe('USD');
  });

  test('returns specific product descriptions instead of the generic fallback', () => {
    expect(__testables.getProductDescription('watchyourtemper Tote', 'watchyourtemper-tote')).toContain('tote');
    expect(__testables.getProductDescription('Pressure Test Hoodie', 'pressure-test-hoodie')).toContain('hoodie');
  });

  test('builds charge summary from printful estimate costs', async () => {
    const summary = await __testables.buildChargeSummary(
      [
        {
          productId: 'prod_1',
          productTitle: 'Pressure Test Tee',
          productImage: '',
          variantId: '100',
          variantName: 'Black / M',
          size: 'M',
          color: 'Black',
          basePrice: 25.5,
          baseCurrency: 'USD',
          unitPrice: 25.5,
          currency: 'USD',
          quantity: 2,
          subtotal: 51,
        },
      ],
      {
        costs: {
          currency: 'USD',
          shipping: '7.50',
          tax: '2.50',
          vat: '0.00',
          digitization: '1.00',
          additional_fee: '0.25',
          fulfillment_fee: '0.75',
          retail_delivery_fee: '0.00',
        },
      },
      'USD',
    );

    expect(summary.total).toBe(63);
  });
});
