export type StoreProduct = {
  id: string;
  name: string;
  description: string;
  price: string;
  variant?: string;
  image?: string;
  stripeUrl: string;
  enabled: boolean;
};

// TODO: Replace placeholder values with your real merch product details.
// - name: product title
// - description: short product description
// - price: display text only (for example "$35 CAD")
// - image: path to image under /public/assets/images/store/
// - stripeUrl: Stripe Payment Link URL (https://buy.stripe.com/...)
export const storeProducts: StoreProduct[] = [
  {
    id: 'watchyourtemper-tee',
    name: 'WATCHYOURTEMPER Tee',
    description: 'Heavyweight black tee with front print placeholder.',
    price: '$00.00', // TODO: replace with real price text
    variant: 'Unisex / S-XXL',
    image: '', // TODO: e.g. /assets/images/store/watchyourtemper-tee.jpg
    stripeUrl: '', // TODO: paste Stripe Payment Link URL
    enabled: false,
  },
  {
    id: 'watchyourtemper-tote',
    name: 'WATCHYOURTEMPER Tote',
    description: 'Canvas tote placeholder for everyday carry.',
    price: '$00.00', // TODO: replace with real price text
    variant: 'One Size',
    image: '', // TODO: e.g. /assets/images/store/watchyourtemper-tote.jpg
    stripeUrl: '', // TODO: paste Stripe Payment Link URL
    enabled: false,
  },
  {
    id: 'pressure-test-tee',
    name: 'PRESSURE TEST Tee',
    description: 'Short sleeve tee placeholder with PRESSURE TEST artwork.',
    price: '$00.00', // TODO: replace with real price text
    variant: 'Unisex / S-XXL',
    image: '', // TODO: e.g. /assets/images/store/pressure-test-tee.jpg
    stripeUrl: '', // TODO: paste Stripe Payment Link URL
    enabled: false,
  },
  {
    id: 'pressure-test-poster',
    name: 'PRESSURE TEST Poster',
    description: 'Limited poster placeholder print.',
    price: '$00.00', // TODO: replace with real price text
    variant: '18 x 24 in',
    image: '', // TODO: e.g. /assets/images/store/pressure-test-poster.jpg
    stripeUrl: '', // TODO: paste Stripe Payment Link URL
    enabled: false,
  },
];
