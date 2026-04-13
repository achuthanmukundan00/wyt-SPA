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

// - name: product title
// - description: short product description
// - price: display text only (for example "$35 CAD")
// - image: path to image under /public/assets/images/store/
// - stripeUrl: Stripe Payment Link URL (https://buy.stripe.com/...)
export const storeProducts: StoreProduct[] = [
  {
    id: 'watchyourtemper-tee',
    name: 'watchyourtemper Tee',
    description: '100% Cotton t-shirt, with watchyourtemper logo printed on chest.',
    price: '$25.25',
    variant: 'Unisex / S-2XL',
    image: '/assets/images/store/watchyourtemper-tee.png', // TODO: e.g. /assets/images/store/watchyourtemper-tee.png
    stripeUrl: '', // TODO: paste Stripe Payment Link URL
    enabled: false,
  },
  {
    id: 'watchyourtemper-tote',
    name: 'watchyourtemper Tote',
    description: 'Dual-strap tote. 100% certified organic cotton.',
    price: '$27.95',
    variant: 'One Size',
    image: '/assets/images/store/watchyourtemper-tote.png', // TODO: e.g. /assets/images/store/watchyourtemper-tote.png
    stripeUrl: '', // TODO: paste Stripe Payment Link URL
    enabled: false,
  },
  {
    id: 'pressure-test-tee',
    name: 'Limited Edition PRESSURE TEST v1.0 Tee',
    description: '100% Cotton t-shirt, with PRESSURE TEST v1.0 graffiti print on chest.',
    price: '$28.25', // TODO: replace with real price text
    variant: 'Unisex / S-2XL',
    image: '/assets/images/store/pressure-test-tee.png', // TODO: e.g. /assets/images/store/pressure-test-tee.png
    stripeUrl: '', // TODO: paste Stripe Payment Link URL
    enabled: false,
  },
  {
    id: 'pressure-test-hoodie',
    name: 'Limited Edition PRESSURE TEST v1.0 Hoodie',
    description: '100% Cotton hoodie, with PRESSURE TEST v1.0 graffiti print on chest.',
    price: '$46.75', // TODO: replace with real price text
    variant: 'Unisex / S-2XL',
    image: '/assets/images/store/pressure-test-hoodie.png', // TODO: e.g. /assets/images/store/pressure-test-hoodie.png
    stripeUrl: '', // TODO: paste Stripe Payment Link URL
    enabled: false,
  },
];
