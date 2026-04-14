type AssetFetcher = {
  fetch(request: Request): Promise<Response>;
};

type DurableObjectNamespaceLike = {
  idFromName(name: string): unknown;
  get(id: unknown): { fetch(request: Request): Promise<Response> };
};

export interface Env {
  ASSETS?: AssetFetcher;
  ORDER_STORE: DurableObjectNamespaceLike;
  PRINTFUL_TOKEN: string;
  PRINTFUL_STORE_ID?: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  PRINTFUL_WEBHOOK_SECRET: string;
  STORE_BASE_URL: string;
  EMAIL_PROVIDER?: string;
  RESEND_API_KEY?: string;
  ORDER_CONFIRMATION_FROM_EMAIL?: string;
}

type ExchangeRatesResponse = {
  amount?: number;
  base?: string;
  rates?: Record<string, number>;
};

type PrintfulEnvelope<T> = {
  code: number;
  result: T;
  error?: { reason?: string; message?: string };
};

type PrintfulProductListItem = {
  id: number;
  name: string;
  thumbnail_url?: string;
  is_ignored?: boolean;
};

type PrintfulSyncVariant = {
  id: number;
  variant_id?: number;
  name: string;
  retail_price: string;
  currency?: string;
  is_ignored?: boolean;
  availability_status?: string;
};

type PrintfulSyncProduct = {
  id: number;
  name: string;
  thumbnail_url?: string;
};

type PrintfulProductDetail = {
  sync_product: PrintfulSyncProduct;
  sync_variants: PrintfulSyncVariant[];
};

type StoreVariant = {
  id: string;
  catalogVariantId?: number;
  name: string;
  size: string;
  color: string;
  basePrice: number;
  baseCurrency: string;
  price: number;
  currency: string;
  availability: boolean;
};

type StoreProduct = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  variants: StoreVariant[];
};

type CartItemInput = {
  productId: string;
  variantId: string;
  quantity: number;
};

type ShippingAddress = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type ShippingRateOption = {
  id: string;
  name: string;
  rate: number;
  currency: string;
  minDeliveryDays?: number;
  maxDeliveryDays?: number;
};

type ChargeSummary = {
  currency: string;
  itemSubtotal: number;
  shipping: number;
  tax: number;
  vat: number;
  digitization: number;
  additionalFee: number;
  fulfillmentFee: number;
  retailDeliveryFee: number;
  total: number;
};

type StoreCountry = {
  code: string;
  name: string;
  region?: string;
};

type CheckoutStartInput = {
  items: CartItemInput[];
  customer: {
    email: string;
  };
  shippingAddress: ShippingAddress;
  currency: string;
  shippingRateId?: string;
};

type ValidatedCartItem = {
  productId: string;
  productTitle: string;
  productImage: string;
  variantId: string;
  catalogVariantId?: number;
  variantName: string;
  size: string;
  color: string;
  basePrice: number;
  baseCurrency: string;
  unitPrice: number;
  currency: string;
  quantity: number;
  subtotal: number;
};

type CheckoutIntent = {
  intentId: string;
  status: 'requires_payment';
  items: ValidatedCartItem[];
  totals: {
    currency: string;
    subtotal: number;
    quantity: number;
  };
  message: string;
};

type CheckoutIntentStatus =
  | 'requires_payment'
  | 'paid'
  | 'order_created'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

type CheckoutIntentRecord = {
  intentId: string;
  status: CheckoutIntentStatus;
  items: ValidatedCartItem[];
  totals: {
    currency: string;
    subtotal: number;
    quantity: number;
  };
  shipping: ShippingAddress;
  customerEmail: string;
  paymentProvider: 'stripe';
  paymentReferenceId: string;
  paymentCheckoutUrl: string;
  idempotencyKey: string;
  shippingRateId: string;
  shippingRateName: string;
  chargeSummary: ChargeSummary;
  printfulOrderId?: string;
  printfulExternalId?: string;
  fulfillmentStatus?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  createdAt: string;
  updatedAt: string;
};

type PaymentStartResult = {
  provider: 'stripe';
  checkoutSessionId: string;
  checkoutUrl: string;
};

type StripeEvent = {
  id?: string;
  type?: string;
  data?: {
    object?: {
      id?: string;
      metadata?: Record<string, string>;
    };
  };
};

type PrintfulWebhookEvent = {
  type?: string;
  event?: string;
  data?: {
    order?: {
      external_id?: string;
      status?: string;
    };
    shipment?: {
      tracking_number?: string;
      tracking_url?: string;
      carrier?: string;
    };
  };
  order?: {
    external_id?: string;
    status?: string;
  };
  shipment?: {
    tracking_number?: string;
    tracking_url?: string;
    carrier?: string;
  };
};

type PrintfulCreateOrderResult = {
  id: number;
  external_id?: string;
  status?: string;
};

type PrintfulShippingRate = {
  id: string;
  name: string;
  rate: string;
  currency: string;
  minDeliveryDays?: number;
  maxDeliveryDays?: number;
};

type PrintfulEstimateCosts = {
  currency: string;
  subtotal?: string;
  shipping?: string;
  digitization?: string;
  additional_fee?: string;
  fulfillment_fee?: string;
  retail_delivery_fee?: string;
  tax?: string;
  vat?: string;
};

type PrintfulEstimateResult = {
  costs: PrintfulEstimateCosts;
};

type PrintfulCountry = {
  code?: string;
  name?: string;
  region?: string;
};

type OrderStoreEventState = {
  status: 'processing' | 'done';
  updatedAt: string;
};

const PRINTFUL_API_BASE = 'https://api.printful.com';
const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const REQUEST_TIMEOUT_MS = 8000;
const ORDER_STORE_NAME = 'watchyourtemper-order-store';
const encoder = new TextEncoder();
const DEFAULT_COUNTRY = 'US';
const FALLBACK_CURRENCY = 'USD';
const SHIPPING_COUNTRY_ALLOWLIST = [
  'US',
  'CA',
  'GB',
  'DE',
  'FR',
  'NL',
  'AU',
  'IE',
  'BE',
  'SE',
  'DK',
  'NZ',
  'ES',
  'IT',
] as const;
const AVAILABLE_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD'] as const;
const COUNTRY_TO_CURRENCY: Record<string, (typeof AVAILABLE_CURRENCIES)[number]> = {
  AU: 'AUD',
  CA: 'CAD',
  GB: 'GBP',
  IE: 'EUR',
  ES: 'EUR',
  FR: 'EUR',
  DE: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  PT: 'EUR',
  AT: 'EUR',
  BE: 'EUR',
  FI: 'EUR',
  GR: 'EUR',
  LU: 'EUR',
  LV: 'EUR',
  LT: 'EUR',
  EE: 'EUR',
  NZ: 'NZD',
  US: 'USD',
};
const statusRank: Record<CheckoutIntentStatus, number> = {
  requires_payment: 0,
  paid: 1,
  order_created: 2,
  in_production: 3,
  shipped: 4,
  delivered: 5,
  cancelled: 6,
  refunded: 7,
};

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
  'access-control-allow-headers':
    'content-type,authorization,stripe-signature,x-printful-signature,x-printful-webhook-signature',
};

const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...corsHeaders,
      ...(init.headers || {}),
    },
  });

const badRequest = (message: string, status = 400) => json({ error: message }, { status });

const nowIso = () => new Date().toISOString();

const safeJsonParse = <T>(rawBody: string) => {
  try {
    return JSON.parse(rawBody) as T;
  } catch {
    throw new Error('Invalid JSON body.');
  }
};

const parseVariantName = (name: string): { color: string; size: string } => {
  const parts = name
    .split('/')
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return { color: parts[0], size: parts[parts.length - 1] };
  }

  return { color: 'Default', size: name || 'Default' };
};

const normalizeProductSlug = (title: string, id: number): string => {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  return base || `product-${id}`;
};

const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  'limited-edition-pressure-test-v10-tee':
    '100% cotton T-shirt printed with Pressure Test v1.0 design.',
  'pressure-test-hoodie':
    'Medium weight cotton hoodie printed with Pressure Test v1.0 design.',
  'watchyourtemper-tee':
    'Essential watchyourtemper tee featuring the core project mark in a clean everyday fit.',
  'watchyourtemper-tote':
    '100% certified organic cotton tote, to help carry your burdens.',
};

const getProductDescription = (title: string, slug: string) => {
  if (PRODUCT_DESCRIPTIONS[slug]) {
    return PRODUCT_DESCRIPTIONS[slug];
  }

  const normalizedTitle = title.toLowerCase();
  if (normalizedTitle.includes('hoodie')) {
    return PRODUCT_DESCRIPTIONS['pressure-test-hoodie'];
  }

  if (normalizedTitle.includes('tote')) {
    return PRODUCT_DESCRIPTIONS['watchyourtemper-tote'];
  }

  if (normalizedTitle.includes('pressure test')) {
    return PRODUCT_DESCRIPTIONS['pressure-test-tee'];
  }

  if (normalizedTitle.includes('tee') || normalizedTitle.includes('shirt')) {
    return PRODUCT_DESCRIPTIONS['watchyourtemper-tee'];
  }

  return 'watchyourtemper merch item.';
};

const normalizeStoreProduct = (payload: PrintfulProductDetail): StoreProduct => {
  const syncProduct = payload.sync_product;
  const syncVariants = Array.isArray(payload.sync_variants) ? payload.sync_variants : [];
  const slug = normalizeProductSlug(syncProduct.name, syncProduct.id);

  return {
    id: String(syncProduct.id),
    slug,
    title: syncProduct.name,
    description: getProductDescription(syncProduct.name, slug),
    image: syncProduct.thumbnail_url || '',
    variants: syncVariants.map((variant) => {
      const parsed = parseVariantName(variant.name || '');
      const retailPrice = Number.parseFloat(variant.retail_price);

      return {
        id: String(variant.id),
        catalogVariantId: typeof variant.variant_id === 'number' ? variant.variant_id : undefined,
        name: variant.name || 'Default',
        size: parsed.size,
        color: parsed.color,
        basePrice: Number.isFinite(retailPrice) ? retailPrice : 0,
        baseCurrency: variant.currency || 'USD',
        price: Number.isFinite(retailPrice) ? retailPrice : 0,
        currency: variant.currency || 'USD',
        availability: !variant.is_ignored && variant.availability_status !== 'discontinued',
      };
    }),
  };
};

const getRequiredEnv = (env: Env, name: keyof Env): string => {
  const value = env[name];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing ${String(name)} environment variable.`);
  }

  return value.trim();
};

const getOptionalEnv = (env: Env, name: keyof Env): string => {
  const value = env[name];
  return typeof value === 'string' ? value.trim() : '';
};

const sanitizeQuantity = (value: unknown) => {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    throw new Error('Each item quantity must be an integer between 1 and 20.');
  }

  return quantity;
};

const parseCartItems = (body: unknown): CartItemInput[] => {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body.');
  }

  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('items must contain at least one cart line.');
  }

  const parsed = items.map((item) => {
    if (!item || typeof item !== 'object') {
      throw new Error('Each item must be an object.');
    }

    const candidate = item as Partial<CartItemInput>;
    if (!candidate.productId || typeof candidate.productId !== 'string') {
      throw new Error('items[].productId is required.');
    }

    if (!candidate.variantId || typeof candidate.variantId !== 'string') {
      throw new Error('items[].variantId is required.');
    }

    return {
      productId: candidate.productId,
      variantId: candidate.variantId,
      quantity: sanitizeQuantity(candidate.quantity),
    };
  });

  const totalQuantity = parsed.reduce((sum, item) => sum + item.quantity, 0);
  if (totalQuantity > 50) {
    throw new Error('Combined cart quantity cannot exceed 50 items.');
  }

  return parsed;
};

const parseShippingAddress = (value: unknown): ShippingAddress => {
  if (!value || typeof value !== 'object') {
    throw new Error('shippingAddress is required.');
  }

  const shipping = value as Partial<ShippingAddress>;
  const requiredFields: Array<keyof ShippingAddress> = ['name', 'line1', 'city', 'state', 'postalCode', 'country'];

  for (const field of requiredFields) {
    const fieldValue = shipping[field];
    if (!fieldValue || typeof fieldValue !== 'string') {
      throw new Error(`shippingAddress.${field} is required.`);
    }
  }

  const country = shipping.country!.toUpperCase();
  if (!isCountryAllowed(country)) {
    throw new Error(`Shipping is not available yet for ${country}.`);
  }

  return {
    name: shipping.name!,
    line1: shipping.line1!,
    line2: typeof shipping.line2 === 'string' ? shipping.line2 : undefined,
    city: shipping.city!,
    state: shipping.state!,
    postalCode: shipping.postalCode!,
    country,
  };
};

const parseCheckoutStartInput = (body: unknown): CheckoutStartInput => {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body.');
  }

  const parsed = body as {
    customer?: { email?: string };
    shippingAddress?: unknown;
    currency?: unknown;
    shippingRateId?: unknown;
  };
  if (!parsed.customer?.email || typeof parsed.customer.email !== 'string') {
    throw new Error('customer.email is required.');
  }

  return {
    items: parseCartItems(body),
    customer: {
      email: parsed.customer.email.trim(),
    },
    shippingAddress: parseShippingAddress(parsed.shippingAddress),
    currency:
      typeof parsed.currency === 'string' && AVAILABLE_CURRENCIES.includes(parsed.currency.trim().toUpperCase() as never)
        ? parsed.currency.trim().toUpperCase()
        : FALLBACK_CURRENCY,
    shippingRateId: typeof parsed.shippingRateId === 'string' ? parsed.shippingRateId.trim() : undefined,
  };
};

const parseCheckoutIntentInput = (body: unknown) => ({ items: parseCartItems(body) });

const parseShippingQuoteInput = (body: unknown) => {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body.');
  }

  const parsed = body as {
    items?: unknown;
    recipient?: Partial<ShippingAddress>;
    currency?: unknown;
    shippingRateId?: unknown;
  };

  if (!parsed.recipient || typeof parsed.recipient !== 'object') {
    throw new Error('recipient is required.');
  }

  const country = typeof parsed.recipient.country === 'string' ? parsed.recipient.country.trim().toUpperCase() : '';
  const state = typeof parsed.recipient.state === 'string' ? parsed.recipient.state.trim().toUpperCase() : '';

  if (!country) {
    throw new Error('recipient.country is required.');
  }

  if (!isCountryAllowed(country)) {
    throw new Error(`Shipping is not available yet for ${country}.`);
  }

  if (['US', 'CA', 'AU'].includes(country) && !state) {
    throw new Error(`recipient.state is required for ${country}.`);
  }

  return {
    items: parseCartItems(body),
    recipient: {
      country,
      state,
      city: typeof parsed.recipient.city === 'string' ? parsed.recipient.city.trim() : '',
      postalCode: typeof parsed.recipient.postalCode === 'string' ? parsed.recipient.postalCode.trim() : '',
      line1: typeof parsed.recipient.line1 === 'string' ? parsed.recipient.line1.trim() : '',
      line2: typeof parsed.recipient.line2 === 'string' ? parsed.recipient.line2.trim() : '',
      name: typeof parsed.recipient.name === 'string' ? parsed.recipient.name.trim() : '',
    },
    currency:
      typeof parsed.currency === 'string' && AVAILABLE_CURRENCIES.includes(parsed.currency.trim().toUpperCase() as never)
        ? parsed.currency.trim().toUpperCase()
        : FALLBACK_CURRENCY,
    shippingRateId: typeof parsed.shippingRateId === 'string' ? parsed.shippingRateId.trim() : undefined,
  };
};

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const signHmacSha256Hex = async (secret: string, payload: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)));
};

const sha256Hex = async (payload: string) => toHex(await crypto.subtle.digest('SHA-256', encoder.encode(payload)));

const timingSafeEqual = (left: string, right: string) => {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
};

const summarizePrintfulResult = (value: unknown) => {
  if (typeof value === 'string') {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return '';
  }

  const candidate = value as Record<string, unknown>;
  if (typeof candidate.message === 'string' && candidate.message.trim()) {
    return candidate.message;
  }

  if (typeof candidate.reason === 'string' && candidate.reason.trim()) {
    return candidate.reason;
  }

  const serialized = JSON.stringify(value);
  return serialized === '{}' ? '' : serialized;
};

const parseAmount = (value?: string) => {
  const amount = Number.parseFloat(value || '0');
  return Number.isFinite(amount) ? amount : 0;
};

const toMoney = (value: number) => Number(value.toFixed(2));

const getPrintfulHeaders = (env: Env) => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getRequiredEnv(env, 'PRINTFUL_TOKEN')}`,
    'Content-Type': 'application/json',
  };

  if (env.PRINTFUL_STORE_ID?.trim()) {
    headers['X-PF-Store-Id'] = env.PRINTFUL_STORE_ID.trim();
  }

  return headers;
};

const defaultCurrencyForCountry = (countryCode?: string) =>
  (countryCode && COUNTRY_TO_CURRENCY[countryCode.toUpperCase()]) || FALLBACK_CURRENCY;

const getProductCollectionBaseCurrency = (products: StoreProduct[]) =>
  products.flatMap((product) => product.variants.map((variant) => variant.baseCurrency || variant.currency))[0] ||
  FALLBACK_CURRENCY;

const detectCountryFromRequest = (request: Request) => {
  const requestWithCf = request as Request & { cf?: { country?: string } };
  const cfCountry = requestWithCf.cf?.country?.trim().toUpperCase();
  if (cfCountry) {
    return cfCountry;
  }

  const headerCountry = request.headers.get('cf-ipcountry')?.trim().toUpperCase();
  if (headerCountry) {
    return headerCountry;
  }

  const acceptLanguage = request.headers.get('accept-language') || '';
  const regionMatch = acceptLanguage.match(/[-_](\w{2})(?:,|;|$)/);
  if (regionMatch?.[1]) {
    return regionMatch[1].toUpperCase();
  }

  return DEFAULT_COUNTRY;
};

const normalizePrintfulCountry = (country: PrintfulCountry): StoreCountry | null => {
  const codeCandidate = typeof country.code === 'string' ? country.code.trim() : '';
  const nameCandidate = typeof country.name === 'string' ? country.name.trim() : '';
  const code = codeCandidate.length === 2 ? codeCandidate.toUpperCase() : nameCandidate.length === 2 ? nameCandidate.toUpperCase() : '';
  const name = codeCandidate.length === 2 ? nameCandidate : nameCandidate.length === 2 ? codeCandidate : nameCandidate;

  if (!code || !name) {
    return null;
  }

  return {
    code,
    name,
    region: country.region,
  };
};

const isCountryAllowed = (countryCode: string) =>
  SHIPPING_COUNTRY_ALLOWLIST.includes(countryCode.toUpperCase() as (typeof SHIPPING_COUNTRY_ALLOWLIST)[number]);

const printfulRequest = async <T>(
  env: Env,
  input: {
    path: string;
    method?: 'GET' | 'POST';
    body?: unknown;
  },
): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${PRINTFUL_API_BASE}${input.path}`, {
      method: input.method || 'GET',
      headers: getPrintfulHeaders(env),
      body: input.body ? JSON.stringify(input.body) : undefined,
      signal: controller.signal,
    });

    const payload = (await response.json()) as PrintfulEnvelope<T>;
    if (!response.ok || payload.code !== 200) {
      const resultMessage = summarizePrintfulResult(payload.result);
      const reason =
        payload.error?.reason || payload.error?.message || resultMessage || `HTTP ${response.status}`;
      console.error('[printful] request failed', {
        path: input.path,
        status: response.status,
        reason,
        payload,
      });
      throw new Error(`Printful request failed: ${reason}`);
    }

    return payload.result;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Printful request timed out.');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const getPrintfulCountries = async (env: Env) => {
  const countries = await printfulRequest<PrintfulCountry[]>(env, { path: '/countries' });

  return countries
    .map(normalizePrintfulCountry)
    .filter((country): country is StoreCountry => Boolean(country))
    .filter((country) => isCountryAllowed(country.code))
    .sort((left, right) => left.name.localeCompare(right.name));
};

const getExchangeRates = async (baseCurrency: string, currencies: readonly string[]) => {
  const normalizedBase = baseCurrency.toUpperCase();
  const targets = currencies.filter((currency) => currency !== normalizedBase);
  const fallback = Object.fromEntries(currencies.map((currency) => [currency, currency === normalizedBase ? 1 : 0]));

  if (!targets.length) {
    return fallback;
  }

  try {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${encodeURIComponent(normalizedBase)}&to=${encodeURIComponent(targets.join(','))}`,
    );

    if (!response.ok) {
      throw new Error(`Exchange rate request failed with HTTP ${response.status}`);
    }

    const payload = (await response.json()) as ExchangeRatesResponse;
    return {
      ...fallback,
      ...(payload.rates || {}),
      [normalizedBase]: 1,
    };
  } catch (error) {
    console.warn('[fx] failed to load live exchange rates', error);
    return fallback;
  }
};

const convertAmount = (
  amount: number,
  sourceCurrency: string,
  targetCurrency: string,
  exchangeRates: Record<string, number>,
) => {
  const normalizedSource = sourceCurrency.toUpperCase();
  const normalizedTarget = targetCurrency.toUpperCase();

  if (normalizedSource === normalizedTarget) {
    return toMoney(amount);
  }

  const rate = exchangeRates[normalizedTarget];
  if (!rate) {
    return toMoney(amount);
  }

  return toMoney(amount * rate);
};

const getStoreProducts = async (env: Env, targetCurrency?: string) => {
  const summaries = await printfulRequest<PrintfulProductListItem[]>(env, { path: '/store/products' });

  const detailedProducts = await Promise.all(
    summaries
      .filter((item) => !item.is_ignored)
      .map(async (item) => {
        try {
          const detail = await printfulRequest<PrintfulProductDetail>(env, { path: `/store/products/${item.id}` });
          return normalizeStoreProduct(detail);
        } catch (error) {
          console.error('[printful] failed to load product detail', item.id, error);
          return null;
        }
      }),
  );

  const products = detailedProducts
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => item.variants.length > 0);

  const normalizedTargetCurrency = targetCurrency?.toUpperCase();
  const sourceCurrency = getProductCollectionBaseCurrency(products);
  if (!normalizedTargetCurrency || normalizedTargetCurrency === sourceCurrency) {
    return products;
  }

  const exchangeRates = await getExchangeRates(sourceCurrency, AVAILABLE_CURRENCIES);
  return products.map((product) => ({
    ...product,
    variants: product.variants.map((variant) => ({
      ...variant,
      price: convertAmount(variant.basePrice, variant.baseCurrency, normalizedTargetCurrency, exchangeRates),
      currency: normalizedTargetCurrency,
    })),
  }));
};

const getStoreProductByIdOrSlug = async (env: Env, idOrSlug: string, targetCurrency?: string) => {
  if (/^\d+$/.test(idOrSlug)) {
    try {
      const detail = await printfulRequest<PrintfulProductDetail>(env, { path: `/store/products/${idOrSlug}` });
      const product = normalizeStoreProduct(detail);
      const sourceCurrency = product.variants[0]?.baseCurrency || FALLBACK_CURRENCY;
      if (!targetCurrency || targetCurrency.toUpperCase() === sourceCurrency) {
        return product;
      }

      const exchangeRates = await getExchangeRates(sourceCurrency, AVAILABLE_CURRENCIES);
      return {
        ...product,
        variants: product.variants.map((variant) => ({
          ...variant,
          price: convertAmount(variant.basePrice, variant.baseCurrency, targetCurrency, exchangeRates),
          currency: targetCurrency.toUpperCase(),
        })),
      };
    } catch {
      // fallback below
    }
  }

  const products = await getStoreProducts(env, targetCurrency);
  return products.find((item) => item.id === idOrSlug || item.slug === idOrSlug) || null;
};

const validateCartItems = async (
  env: Env,
  items: CartItemInput[],
  targetCurrency?: string,
): Promise<ValidatedCartItem[]> => {
  const productCache = new Map<string, Promise<StoreProduct | null>>();

  const loadProduct = (productId: string) => {
    const existing = productCache.get(productId);
    if (existing) {
      return existing;
    }

    const next = getStoreProductByIdOrSlug(env, productId, targetCurrency);
    productCache.set(productId, next);
    return next;
  };

  const validated = await Promise.all(
    items.map(async (item) => {
      const product = await loadProduct(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      const variant = product.variants.find((candidate) => candidate.id === item.variantId);
      if (!variant || !variant.availability) {
        throw new Error(`Variant unavailable: ${item.variantId}`);
      }

      const subtotal = Number((variant.price * item.quantity).toFixed(2));
      return {
        productId: product.id,
        productTitle: product.title,
        productImage: product.image,
        variantId: variant.id,
        catalogVariantId: variant.catalogVariantId,
        variantName: variant.name,
        size: variant.size,
        color: variant.color,
        basePrice: variant.basePrice,
        baseCurrency: variant.baseCurrency,
        unitPrice: variant.price,
        currency: variant.currency,
        quantity: item.quantity,
        subtotal,
      };
    }),
  );

  const currencies = new Set(validated.map((item) => item.currency));
  if (currencies.size > 1) {
    throw new Error('Cart items must all use the same currency.');
  }

  return validated;
};

const buildCheckoutIntent = async (
  env: Env,
  input: {
    items: CartItemInput[];
    currency?: string;
  },
): Promise<CheckoutIntent> => {
  const validatedItems = await validateCartItems(env, input.items, input.currency);
  const subtotal = Number(validatedItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  const quantity = validatedItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    intentId: crypto.randomUUID(),
    status: 'requires_payment',
    items: validatedItems,
    totals: {
      currency: validatedItems[0]?.currency || 'USD',
      subtotal,
      quantity,
    },
    message: 'Checkout intent created. Attach payment provider next.',
  };
};

const buildCheckoutIdempotencyKey = async (input: CheckoutStartInput) => {
  const canonicalItems = [...input.items]
    .sort((left, right) =>
      `${left.productId}:${left.variantId}`.localeCompare(`${right.productId}:${right.variantId}`),
    )
    .map((item) => `${item.productId}:${item.variantId}:${item.quantity}`)
    .join('|');

  const canonicalShipping = [
    input.shippingAddress.name.trim(),
    input.shippingAddress.line1.trim(),
    input.shippingAddress.line2?.trim() || '',
    input.shippingAddress.city.trim(),
    input.shippingAddress.state.trim(),
    input.shippingAddress.postalCode.trim(),
    input.shippingAddress.country.trim().toUpperCase(),
    input.currency.trim().toUpperCase(),
    input.shippingRateId?.trim().toUpperCase() || 'STANDARD',
  ].join('|');

  return sha256Hex(`${input.customer.email.trim().toLowerCase()}|${canonicalShipping}|${canonicalItems}`);
};

const buildShippingRecipient = (recipient: Partial<ShippingAddress>) => ({
  name: recipient.name || '',
  address1: recipient.line1 || '',
  address2: recipient.line2 || '',
  city: recipient.city || '',
  state_code: recipient.state || '',
  country_code: recipient.country || '',
  zip: recipient.postalCode || '',
});

const hasFullEstimateAddress = (recipient: Partial<ShippingAddress>) =>
  Boolean(
    recipient.name?.trim() &&
      recipient.line1?.trim() &&
      recipient.city?.trim() &&
      recipient.postalCode?.trim() &&
      recipient.country?.trim(),
  );

const getShippingLocale = (request: Request) => {
  const acceptLanguage = request.headers.get('accept-language') || '';
  return acceptLanguage.toLowerCase().startsWith('es') ? 'es_ES' : 'en_US';
};

const getShippingRates = async (
  env: Env,
  request: Request,
  input: {
    items: ValidatedCartItem[];
    recipient: Partial<ShippingAddress>;
    currency: string;
  },
) => {
  const rates = await printfulRequest<PrintfulShippingRate[]>(env, {
    path: '/shipping/rates',
    method: 'POST',
    body: {
      recipient: buildShippingRecipient(input.recipient),
      items: input.items.map((item) => {
        if (!item.catalogVariantId) {
          throw new Error(`Missing catalog variant_id for sync variant ${item.variantId}`);
        }

        return {
          variant_id: item.catalogVariantId,
          quantity: item.quantity,
          value: item.unitPrice.toFixed(2),
        };
      }),
      currency: input.currency,
      locale: getShippingLocale(request),
    },
  });

  return rates.map((rate) => ({
    id: rate.id,
    name: rate.name,
    rate: parseAmount(rate.rate),
    currency: rate.currency || input.currency,
    minDeliveryDays: rate.minDeliveryDays,
    maxDeliveryDays: rate.maxDeliveryDays,
  }));
};

const estimateOrderCosts = async (
  env: Env,
  input: {
    items: ValidatedCartItem[];
    shippingRateId: string;
    recipient: ShippingAddress;
  },
) =>
  printfulRequest<PrintfulEstimateResult>(env, {
    path: '/orders/estimate-costs',
    method: 'POST',
    body: {
      shipping: input.shippingRateId,
      recipient: {
        name: input.recipient.name,
        address1: input.recipient.line1,
        address2: input.recipient.line2,
        city: input.recipient.city,
        state_code: input.recipient.state,
        country_code: input.recipient.country,
        zip: input.recipient.postalCode,
      },
      items: input.items.map((item) => ({
        sync_variant_id: Number(item.variantId),
        quantity: item.quantity,
        retail_price: item.unitPrice.toFixed(2),
      })),
    },
  });

const buildChargeSummary = async (
  items: ValidatedCartItem[],
  estimate: PrintfulEstimateResult,
  targetCurrency?: string,
): Promise<ChargeSummary> => {
  const requestedCurrency = targetCurrency?.toUpperCase() || items[0]?.currency || FALLBACK_CURRENCY;
  const estimateCurrency = estimate.costs.currency || requestedCurrency;
  const exchangeRates = await getExchangeRates(estimateCurrency, AVAILABLE_CURRENCIES);
  const convertEstimateAmount = (value?: string) =>
    convertAmount(parseAmount(value), estimateCurrency, requestedCurrency, exchangeRates);

  const itemSubtotal = toMoney(items.reduce((sum, item) => sum + item.subtotal, 0));
  const shipping = convertEstimateAmount(estimate.costs.shipping);
  const tax = convertEstimateAmount(estimate.costs.tax);
  const vat = convertEstimateAmount(estimate.costs.vat);
  const digitization = convertEstimateAmount(estimate.costs.digitization);
  const additionalFee = convertEstimateAmount(estimate.costs.additional_fee);
  const fulfillmentFee = convertEstimateAmount(estimate.costs.fulfillment_fee);
  const retailDeliveryFee = convertEstimateAmount(estimate.costs.retail_delivery_fee);

  return {
    currency: requestedCurrency,
    itemSubtotal,
    shipping,
    tax,
    vat,
    digitization,
    additionalFee,
    fulfillmentFee,
    retailDeliveryFee,
    total: toMoney(itemSubtotal + shipping + tax + vat + digitization + additionalFee + fulfillmentFee + retailDeliveryFee),
  };
};

const selectShippingOption = (options: ShippingRateOption[], requestedRateId?: string) => {
  if (!options.length) {
    throw new Error('No shipping options available for this destination.');
  }

  return (
    options.find((option) => option.id === requestedRateId) ||
    options.find((option) => option.id === 'STANDARD') ||
    options[0]
  );
};

const buildStripeCheckoutBody = (
  intent: CheckoutIntent,
  customerEmail: string,
  storeBaseUrl: string,
  chargeSummary: ChargeSummary,
  shippingRateName: string,
) => {
  const successUrl = new URL('/store/success', storeBaseUrl);
  successUrl.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');
  successUrl.searchParams.set('intentId', intent.intentId);

  const cancelUrl = new URL('/store/cancel', storeBaseUrl);

  const body = new URLSearchParams({
    mode: 'payment',
    success_url: successUrl.toString(),
    cancel_url: cancelUrl.toString(),
    customer_email: customerEmail,
    client_reference_id: intent.intentId,
    'metadata[intentId]': intent.intentId,
    'metadata[itemCount]': String(intent.items.length),
    'metadata[cartQuantity]': String(intent.totals.quantity),
    'metadata[shippingMethod]': shippingRateName,
  });

  let nextLineIndex = 0;
  intent.items.forEach((item, index) => {
    body.set(`line_items[${index}][quantity]`, String(item.quantity));
    body.set(`line_items[${index}][price_data][currency]`, chargeSummary.currency.toLowerCase());
    body.set(`line_items[${index}][price_data][unit_amount]`, String(Math.round(item.unitPrice * 100)));
    body.set(
      `line_items[${index}][price_data][product_data][name]`,
      `${item.productTitle} - ${item.variantName}`,
    );
    nextLineIndex = index + 1;
  });

  const appendExtraLine = (name: string, amount: number) => {
    if (amount <= 0) {
      return;
    }

    body.set(`line_items[${nextLineIndex}][quantity]`, '1');
    body.set(`line_items[${nextLineIndex}][price_data][currency]`, chargeSummary.currency.toLowerCase());
    body.set(`line_items[${nextLineIndex}][price_data][unit_amount]`, String(Math.round(amount * 100)));
    body.set(`line_items[${nextLineIndex}][price_data][product_data][name]`, name);
    nextLineIndex += 1;
  };

  appendExtraLine(`Shipping - ${shippingRateName}`, chargeSummary.shipping);
  appendExtraLine('Taxes', chargeSummary.tax + chargeSummary.vat);
  appendExtraLine('Fulfillment fees', chargeSummary.digitization + chargeSummary.additionalFee + chargeSummary.fulfillmentFee + chargeSummary.retailDeliveryFee);

  return body;
};

const createStripeCheckoutSession = async (
  env: Env,
  input: {
    intent: CheckoutIntent;
    customerEmail: string;
    idempotencyKey: string;
    chargeSummary: ChargeSummary;
    shippingRateName: string;
  },
): Promise<PaymentStartResult> => {
  const secretKey = getRequiredEnv(env, 'STRIPE_SECRET_KEY');
  const storeBaseUrl = getRequiredEnv(env, 'STORE_BASE_URL');
  const body = buildStripeCheckoutBody(
    input.intent,
    input.customerEmail,
    storeBaseUrl,
    input.chargeSummary,
    input.shippingRateName,
  );

  const response = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': input.idempotencyKey,
    },
    body,
  });

  const payload = (await response.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!response.ok || !payload.id || !payload.url) {
    throw new Error(payload.error?.message || 'Failed to create Stripe checkout session.');
  }

  return {
    provider: 'stripe',
    checkoutSessionId: payload.id,
    checkoutUrl: payload.url,
  };
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildOrderConfirmationEmail = (record: CheckoutIntentRecord) => {
  const total = `${record.chargeSummary.currency} ${record.chargeSummary.total.toFixed(2)}`;
  const lineItemsText = record.items
    .map(
      (item) =>
        `- ${item.productTitle} - ${item.variantName} x${item.quantity} (${item.currency} ${item.subtotal.toFixed(2)})`,
    )
    .join('\n');
  const lineItemsHtml = record.items
    .map(
      (item) =>
        `<li>${escapeHtml(item.productTitle)} - ${escapeHtml(item.variantName)} x${item.quantity} (${escapeHtml(
          item.currency,
        )} ${item.subtotal.toFixed(2)})</li>`,
    )
    .join('');
  const line2 = record.shipping.line2 ? `${record.shipping.line2}\n` : '';
  const printfulReference = record.printfulOrderId || record.printfulExternalId || 'Pending';

  const text = [
    `Thanks for your order, ${record.shipping.name}.`,
    '',
    'We have received your payment and successfully created your order with Printful.',
    '',
    `Order reference: ${printfulReference}`,
    'Items:',
    lineItemsText,
    '',
    `Shipping method: ${record.shippingRateName}`,
    `Total charged: ${total}`,
    '',
    'Shipping to:',
    `${record.shipping.name}`,
    `${record.shipping.line1}`,
    `${line2}${record.shipping.city}, ${record.shipping.state} ${record.shipping.postalCode}`,
    `${record.shipping.country}`,
    '',
    'You will receive another email with tracking details once the order ships.',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111;">
      <h1 style="font-size: 24px; margin-bottom: 16px;">Order confirmed</h1>
      <p>Thanks for your order, ${escapeHtml(record.shipping.name)}.</p>
      <p>We have received your payment and successfully created your order with Printful.</p>
      <div style="border: 1px solid #ddd; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px;"><strong>Order reference:</strong> ${escapeHtml(printfulReference)}</p>
        <p style="margin: 0 0 8px;"><strong>Items:</strong></p>
        <ul style="margin: 0 0 8px 20px; padding: 0;">${lineItemsHtml}</ul>
        <p style="margin: 0 0 8px;"><strong>Shipping method:</strong> ${escapeHtml(record.shippingRateName)}</p>
        <p style="margin: 0;"><strong>Total charged:</strong> ${escapeHtml(total)}</p>
      </div>
      <div style="margin: 20px 0;">
        <p style="margin: 0 0 8px;"><strong>Shipping to:</strong></p>
        <p style="margin: 0;">
          ${escapeHtml(record.shipping.name)}<br />
          ${escapeHtml(record.shipping.line1)}<br />
          ${record.shipping.line2 ? `${escapeHtml(record.shipping.line2)}<br />` : ''}
          ${escapeHtml(record.shipping.city)}, ${escapeHtml(record.shipping.state)} ${escapeHtml(
            record.shipping.postalCode,
          )}<br />
          ${escapeHtml(record.shipping.country)}
        </p>
      </div>
      <p>You will receive another email with tracking details once the order ships.</p>
    </div>
  `.trim();

  return {
    subject:
      record.items.length === 1
        ? `watchyourtemper order confirmed - ${record.items[0].productTitle}`
        : `watchyourtemper order confirmed - ${record.items.length} items`,
    text,
    html,
  };
};

const sendOrderConfirmationEmail = async (env: Env, record: CheckoutIntentRecord) => {
  const provider = getOptionalEnv(env, 'EMAIL_PROVIDER') || 'resend';
  if (provider !== 'resend') {
    throw new Error(`Unsupported EMAIL_PROVIDER: ${provider}`);
  }

  const apiKey = getOptionalEnv(env, 'RESEND_API_KEY');
  const from = getOptionalEnv(env, 'ORDER_CONFIRMATION_FROM_EMAIL');
  if (!apiKey || !from) {
    return { sent: false as const, reason: 'missing_config' as const };
  }

  const email = buildOrderConfirmationEmail(record);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [record.customerEmail],
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message || `Email request failed with HTTP ${response.status}`);
  }

  return { sent: true as const };
};

const resolveNextStatus = (current: CheckoutIntentStatus, next?: CheckoutIntentStatus) => {
  if (!next) {
    return current;
  }

  if (next === 'cancelled' || next === 'refunded') {
    return next;
  }

  return statusRank[next] >= statusRank[current] ? next : current;
};

const verifyStripeSignature = async (env: Env, rawBody: string, signatureHeader?: string) => {
  const secret = getRequiredEnv(env, 'STRIPE_WEBHOOK_SECRET');
  if (!signatureHeader) {
    throw new Error('Missing Stripe-Signature header.');
  }

  const parts = signatureHeader.split(',').map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2);
  const signature = parts.find((part) => part.startsWith('v1='))?.slice(3);
  if (!timestamp || !signature) {
    throw new Error('Malformed Stripe-Signature header.');
  }

  const expected = await signHmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  if (!timingSafeEqual(signature, expected)) {
    throw new Error('Invalid Stripe webhook signature.');
  }
};

const verifyPrintfulWebhook = async (
  env: Env,
  rawBody: string,
  signatureHeader?: string,
  authorizationHeader?: string,
) => {
  const secret = getRequiredEnv(env, 'PRINTFUL_WEBHOOK_SECRET');

  if (signatureHeader) {
    const expected = await signHmacSha256Hex(secret, rawBody);
    if (timingSafeEqual(signatureHeader, expected)) {
      return;
    }
  }

  if (authorizationHeader === `Bearer ${secret}`) {
    return;
  }

  throw new Error('Invalid Printful webhook signature/token.');
};

const toStatusFromPrintful = (status?: string): CheckoutIntentStatus | undefined => {
  switch (status) {
    case 'fulfilled':
      return 'delivered';
    case 'shipped':
      return 'shipped';
    case 'inprocess':
      return 'in_production';
    case 'canceled':
      return 'cancelled';
    default:
      return undefined;
  }
};

const buildPrintfulWebhookEventId = async (rawBody: string) => sha256Hex(rawBody);

const getOrderStoreStub = (env: Env) => {
  const id = env.ORDER_STORE.idFromName(ORDER_STORE_NAME);
  return env.ORDER_STORE.get(id);
};

const orderStoreRequest = async <T>(env: Env, path: string, init?: RequestInit): Promise<T> => {
  const stub = getOrderStoreStub(env);
  const response = await stub.fetch(new Request(`https://order-store${path}`, init));
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || 'Order store request failed.');
  }

  return payload;
};

const getRecordById = async (env: Env, intentId: string) =>
  orderStoreRequest<{ record: CheckoutIntentRecord | null }>(env, `/records/by-intent/${encodeURIComponent(intentId)}`).then(
    (payload) => payload.record,
  );

const getRecordByPaymentReference = async (env: Env, paymentReferenceId: string) =>
  orderStoreRequest<{ record: CheckoutIntentRecord | null }>(
    env,
    `/records/by-payment/${encodeURIComponent(paymentReferenceId)}`,
  ).then((payload) => payload.record);

const getRecordByIdempotencyKey = async (env: Env, idempotencyKey: string) =>
  orderStoreRequest<{ record: CheckoutIntentRecord | null }>(
    env,
    `/records/by-idempotency/${encodeURIComponent(idempotencyKey)}`,
  ).then((payload) => payload.record);

const createCheckoutIntentRecord = async (
  env: Env,
  record: CheckoutIntentRecord,
): Promise<CheckoutIntentRecord> =>
  orderStoreRequest<{ record: CheckoutIntentRecord }>(env, '/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ record }),
  }).then((payload) => payload.record);

const updateCheckoutIntent = async (
  env: Env,
  intentId: string,
  patch: Partial<CheckoutIntentRecord>,
): Promise<CheckoutIntentRecord | null> =>
  orderStoreRequest<{ record: CheckoutIntentRecord | null }>(env, `/records/${encodeURIComponent(intentId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patch }),
  }).then((payload) => payload.record);

const startWebhookEvent = async (env: Env, eventId: string) =>
  orderStoreRequest<{ acquired: boolean; state?: OrderStoreEventState }>(env, '/events/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId }),
  });

const finishWebhookEvent = async (env: Env, eventId: string) =>
  orderStoreRequest<{ ok: true }>(env, '/events/finish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId }),
  });

const releaseWebhookEvent = async (env: Env, eventId: string) =>
  orderStoreRequest<{ ok: true }>(env, '/events/release', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId }),
  });

const createPrintfulOrder = async (
  env: Env,
  input: {
    externalId: string;
    shipping: string;
    recipient: {
      name: string;
      address1: string;
      address2?: string;
      city: string;
      state_code: string;
      zip: string;
      country_code: string;
      email: string;
    };
    items: Array<{ sync_variant_id: number; quantity: number }>;
  },
): Promise<PrintfulCreateOrderResult> => {
  if (!input.items.length) {
    throw new Error('Printful order requires at least one item.');
  }

  return printfulRequest<PrintfulCreateOrderResult>(env, {
    path: '/orders',
    method: 'POST',
    body: {
      external_id: input.externalId,
      shipping: input.shipping,
      recipient: input.recipient,
      items: input.items,
      confirm: true,
    },
  });
};

const handleCheckoutIntent = async (request: Request, env: Env) => {
  const body = safeJsonParse<{ items: CartItemInput[] }>(await request.text());
  const input = parseCheckoutIntentInput(body);
  const intent = await buildCheckoutIntent(env, input);
  return json({ intent });
};

const handleStorePreferences = async (request: Request, env: Env) => {
  const detectedCountry = detectCountryFromRequest(request);
  const countries = await getPrintfulCountries(env);
  const baseProducts = await getStoreProducts(env);
  const baseCurrency = getProductCollectionBaseCurrency(baseProducts);
  const exchangeRates = await getExchangeRates(baseCurrency, AVAILABLE_CURRENCIES);

  return json({
    detectedCountry,
    defaultCurrency: defaultCurrencyForCountry(detectedCountry),
    countries,
    currencies: AVAILABLE_CURRENCIES,
    exchangeRates,
    baseCurrency,
  });
};

const buildShippingQuoteResponse = async (
  request: Request,
  env: Env,
  input: {
    items: CartItemInput[];
    recipient: Partial<ShippingAddress> & Pick<ShippingAddress, 'country' | 'state'>;
    currency: string;
    shippingRateId?: string;
    intentId?: string;
  },
) => {
  const validatedItems = await validateCartItems(env, input.items);
  const shippingOptions = await getShippingRates(env, request, {
    items: validatedItems,
    recipient: input.recipient,
    currency: input.currency,
  });
  const selectedShipping = selectShippingOption(shippingOptions, input.shippingRateId);
  let chargeSummary: ChargeSummary | null = null;

  if (hasFullEstimateAddress(input.recipient)) {
    const estimate = await estimateOrderCosts(env, {
      items: validatedItems,
      shippingRateId: selectedShipping.id,
      recipient: {
        name: input.recipient.name!.trim(),
        line1: input.recipient.line1!.trim(),
        line2: input.recipient.line2?.trim(),
        city: input.recipient.city!.trim(),
        state: input.recipient.state,
        postalCode: input.recipient.postalCode!.trim(),
        country: input.recipient.country,
      },
    });

    chargeSummary = await buildChargeSummary(validatedItems, estimate, input.currency);
  }

  return {
    selectedShippingRateId: selectedShipping.id,
    shippingOptions,
    chargeSummary,
  };
};

const handleShippingQuote = async (request: Request, env: Env) => {
  const body = safeJsonParse<{
    items: CartItemInput[];
    recipient: Partial<ShippingAddress>;
    currency?: string;
    shippingRateId?: string;
  }>(await request.text());
  const input = parseShippingQuoteInput(body);

  return json(
    await buildShippingQuoteResponse(request, env, {
      items: input.items,
      recipient: input.recipient,
      currency: input.currency,
      shippingRateId: input.shippingRateId,
    }),
  );
};

const handleCheckoutStart = async (request: Request, env: Env) => {
  const body = safeJsonParse<CheckoutStartInput>(await request.text());
  const input = parseCheckoutStartInput(body);
  const idempotencyKey = await buildCheckoutIdempotencyKey(input);
  const existing = await getRecordByIdempotencyKey(env, idempotencyKey);

  if (existing) {
    return json({
      intent: {
        intentId: existing.intentId,
        status: existing.status,
        items: existing.items,
        totals: existing.totals,
        shippingRateId: existing.shippingRateId,
        chargeSummary: existing.chargeSummary,
        message: 'Reused existing checkout session.',
      },
      payment: {
        provider: existing.paymentProvider,
        checkoutSessionId: existing.paymentReferenceId,
        checkoutUrl: existing.paymentCheckoutUrl,
      },
      reused: true,
    });
  }

  const intent = await buildCheckoutIntent(env, { items: input.items, currency: input.currency });
  const shippingQuote = await buildShippingQuoteResponse(request, env, {
    items: input.items,
    recipient: input.shippingAddress,
    currency: input.currency,
    shippingRateId: input.shippingRateId,
    intentId: intent.intentId,
  });
  if (!shippingQuote.chargeSummary) {
    throw new Error('Unable to calculate final order total.');
  }

  const payment = await createStripeCheckoutSession(env, {
    intent,
    customerEmail: input.customer.email,
    idempotencyKey,
    chargeSummary: shippingQuote.chargeSummary,
    shippingRateName:
      shippingQuote.shippingOptions.find((option) => option.id === shippingQuote.selectedShippingRateId)?.name ||
      shippingQuote.selectedShippingRateId,
  });

  const createdAt = nowIso();
  const record = await createCheckoutIntentRecord(env, {
    intentId: intent.intentId,
    status: 'requires_payment',
    items: intent.items,
    totals: intent.totals,
    shipping: input.shippingAddress,
    customerEmail: input.customer.email,
    paymentProvider: payment.provider,
    paymentReferenceId: payment.checkoutSessionId,
    paymentCheckoutUrl: payment.checkoutUrl,
    idempotencyKey,
    shippingRateId: shippingQuote.selectedShippingRateId,
    shippingRateName:
      shippingQuote.shippingOptions.find((option) => option.id === shippingQuote.selectedShippingRateId)?.name ||
      shippingQuote.selectedShippingRateId,
    chargeSummary: shippingQuote.chargeSummary,
    createdAt,
    updatedAt: createdAt,
  });

  return json({
    intent: {
      intentId: record.intentId,
      status: record.status,
      items: record.items,
      totals: record.totals,
      shippingRateId: record.shippingRateId,
      chargeSummary: record.chargeSummary,
      message: 'Checkout session created.',
    },
    payment,
  });
};

const handlePaymentWebhook = async (request: Request, env: Env) => {
  const rawBody = await request.text();
  await verifyStripeSignature(env, rawBody, request.headers.get('stripe-signature') || undefined);
  const event = safeJsonParse<StripeEvent>(rawBody);

  if (!event.id) {
    throw new Error('Missing Stripe event id.');
  }

  const eventKey = `stripe:${event.id}`;
  const eventLease = await startWebhookEvent(env, eventKey);
  if (!eventLease.acquired) {
    return json({ ok: true, duplicate: true });
  }

  try {
    if (event.type !== 'checkout.session.completed') {
      await finishWebhookEvent(env, eventKey);
      return json({ ok: true, ignored: true });
    }

    const object = event.data?.object;
    const intentId = object?.metadata?.intentId;
    const paymentReferenceId = object?.id;

    const record =
      (intentId ? await getRecordById(env, intentId) : null) ||
      (paymentReferenceId ? await getRecordByPaymentReference(env, paymentReferenceId) : null);

    if (!record) {
      await finishWebhookEvent(env, eventKey);
      return json({ ok: true, ignored: true, reason: 'intent_not_found' });
    }

    if (
      record.status === 'order_created' ||
      record.status === 'in_production' ||
      record.status === 'shipped' ||
      record.status === 'delivered'
    ) {
      await finishWebhookEvent(env, eventKey);
      return json({ ok: true, duplicate: true });
    }

    if (record.status === 'requires_payment') {
      await updateCheckoutIntent(env, record.intentId, { status: 'paid' });
    }

    const printfulOrder = await createPrintfulOrder(env, {
      externalId: record.intentId,
      shipping: record.shippingRateId,
      recipient: {
        name: record.shipping.name,
        address1: record.shipping.line1,
        address2: record.shipping.line2,
        city: record.shipping.city,
        state_code: record.shipping.state,
        zip: record.shipping.postalCode,
        country_code: record.shipping.country,
        email: record.customerEmail,
      },
      items: record.items.map((item) => ({
        sync_variant_id: Number(item.variantId),
        quantity: item.quantity,
      })),
    });

    const updatedRecord = await updateCheckoutIntent(env, record.intentId, {
      status: 'order_created',
      printfulOrderId: String(printfulOrder.id),
      printfulExternalId: printfulOrder.external_id || record.intentId,
      fulfillmentStatus: printfulOrder.status || 'draft',
    });

    if (updatedRecord) {
      try {
        const emailResult = await sendOrderConfirmationEmail(env, updatedRecord);
        if (!emailResult.sent) {
          console.warn('[email] order confirmation skipped', {
            intentId: updatedRecord.intentId,
            reason: emailResult.reason,
          });
        }
      } catch (error) {
        console.error('[email] failed to send order confirmation', {
          intentId: updatedRecord.intentId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    await finishWebhookEvent(env, eventKey);
    return json({ ok: true });
  } catch (error) {
    await releaseWebhookEvent(env, eventKey);
    throw error;
  }
};

const handlePrintfulWebhook = async (request: Request, env: Env) => {
  const rawBody = await request.text();
  await verifyPrintfulWebhook(
    env,
    rawBody,
    request.headers.get('x-printful-signature') || request.headers.get('x-printful-webhook-signature') || undefined,
    request.headers.get('authorization') || undefined,
  );

  const eventKey = `printful:${await buildPrintfulWebhookEventId(rawBody)}`;
  const eventLease = await startWebhookEvent(env, eventKey);
  if (!eventLease.acquired) {
    return json({ ok: true, duplicate: true });
  }

  try {
    const event = safeJsonParse<PrintfulWebhookEvent>(rawBody);
    const payload = event.data || event;
    const externalId = payload.order?.external_id;

    if (!externalId) {
      await finishWebhookEvent(env, eventKey);
      return json({ ok: true, ignored: true, reason: 'external_id_missing' });
    }

    const record = await getRecordById(env, externalId);
    if (!record) {
      await finishWebhookEvent(env, eventKey);
      return json({ ok: true, ignored: true, reason: 'intent_not_found' });
    }

    const nextStatus = toStatusFromPrintful(payload.order?.status);
    await updateCheckoutIntent(env, record.intentId, {
      status: resolveNextStatus(record.status, nextStatus),
      fulfillmentStatus: payload.order?.status || record.fulfillmentStatus,
      trackingNumber: payload.shipment?.tracking_number || record.trackingNumber,
      trackingUrl: payload.shipment?.tracking_url || record.trackingUrl,
      carrier: payload.shipment?.carrier || record.carrier,
    });

    await finishWebhookEvent(env, eventKey);
    return json({ ok: true });
  } catch (error) {
    await releaseWebhookEvent(env, eventKey);
    throw error;
  }
};

const handleApiRequest = async (request: Request, env: Env) => {
  const url = new URL(request.url);

  if (request.method === 'GET' && url.pathname === '/api/health') {
    return json({ ok: true, storage: 'durable-object' });
  }

  if (request.method === 'GET' && url.pathname === '/api/store/products') {
    const currency = url.searchParams.get('currency') || undefined;
    const products = await getStoreProducts(env, currency);
    return json({ products });
  }

  if (request.method === 'GET' && url.pathname === '/api/store/preferences') {
    return handleStorePreferences(request, env);
  }

  if (request.method === 'GET' && url.pathname.startsWith('/api/store/products/')) {
    const idOrSlug = decodeURIComponent(url.pathname.replace('/api/store/products/', ''));
    const currency = url.searchParams.get('currency') || undefined;
    const product = await getStoreProductByIdOrSlug(env, idOrSlug, currency);
    if (!product) {
      return badRequest('Product not found.', 404);
    }

    return json({ product });
  }

  if (request.method === 'POST' && url.pathname === '/api/store/checkout-intent') {
    return handleCheckoutIntent(request, env);
  }

  if (request.method === 'POST' && url.pathname === '/api/store/shipping-quote') {
    return handleShippingQuote(request, env);
  }

  if (request.method === 'POST' && url.pathname === '/api/store/checkout-start') {
    return handleCheckoutStart(request, env);
  }

  if (request.method === 'POST' && url.pathname === '/api/webhooks/payment') {
    return handlePaymentWebhook(request, env);
  }

  if (request.method === 'POST' && url.pathname === '/api/webhooks/printful') {
    return handlePrintfulWebhook(request, env);
  }

  return badRequest('Not found.', 404);
};

export class OrderStoreDurableObject {
  private readonly state: any;

  constructor(state: any) {
    this.state = state;
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'POST' && path === '/records') {
      const payload = safeJsonParse<{ record?: CheckoutIntentRecord }>(await request.text());
      if (!payload.record) {
        return badRequest('record is required.');
      }

      const existingIntentId = (await this.state.storage.get(`idempotency:${payload.record.idempotencyKey}`)) as
        | string
        | undefined;
      if (existingIntentId) {
        const existing = (await this.state.storage.get(`intent:${existingIntentId}`)) as
          | CheckoutIntentRecord
          | undefined;
        if (existing) {
          return json({ record: existing });
        }
      }

      await this.state.storage.put(`intent:${payload.record.intentId}`, payload.record);
      await this.state.storage.put(`payment:${payload.record.paymentReferenceId}`, payload.record.intentId);
      await this.state.storage.put(`idempotency:${payload.record.idempotencyKey}`, payload.record.intentId);

      return json({ record: payload.record });
    }

    if (request.method === 'GET' && path.startsWith('/records/by-intent/')) {
      const intentId = decodeURIComponent(path.replace('/records/by-intent/', ''));
      const record = (await this.state.storage.get(`intent:${intentId}`)) || null;
      return json({ record });
    }

    if (request.method === 'GET' && path.startsWith('/records/by-payment/')) {
      const paymentReferenceId = decodeURIComponent(path.replace('/records/by-payment/', ''));
      const intentId = (await this.state.storage.get(`payment:${paymentReferenceId}`)) as string | undefined;
      const record = intentId
        ? ((await this.state.storage.get(`intent:${intentId}`)) as CheckoutIntentRecord | undefined)
        : null;
      return json({ record: record || null });
    }

    if (request.method === 'GET' && path.startsWith('/records/by-idempotency/')) {
      const idempotencyKey = decodeURIComponent(path.replace('/records/by-idempotency/', ''));
      const intentId = (await this.state.storage.get(`idempotency:${idempotencyKey}`)) as string | undefined;
      const record = intentId
        ? ((await this.state.storage.get(`intent:${intentId}`)) as CheckoutIntentRecord | undefined)
        : null;
      return json({ record: record || null });
    }

    if (request.method === 'PUT' && path.startsWith('/records/')) {
      const intentId = decodeURIComponent(path.replace('/records/', ''));
      const existing = (await this.state.storage.get(`intent:${intentId}`)) as CheckoutIntentRecord | undefined;
      if (!existing) {
        return json({ record: null });
      }

      const payload = safeJsonParse<{ patch?: Partial<CheckoutIntentRecord> }>(await request.text());
      const updated: CheckoutIntentRecord = {
        ...existing,
        ...(payload.patch || {}),
        intentId: existing.intentId,
        updatedAt: nowIso(),
      };

      await this.state.storage.put(`intent:${intentId}`, updated);
      return json({ record: updated });
    }

    if (request.method === 'POST' && path === '/events/start') {
      const payload = safeJsonParse<{ eventId?: string }>(await request.text());
      if (!payload.eventId) {
        return badRequest('eventId is required.');
      }

      const key = `event:${payload.eventId}`;
      const existing = (await this.state.storage.get(key)) as OrderStoreEventState | undefined;
      if (existing) {
        return json({ acquired: false, state: existing });
      }

      const state: OrderStoreEventState = { status: 'processing', updatedAt: nowIso() };
      await this.state.storage.put(key, state);
      return json({ acquired: true, state });
    }

    if (request.method === 'POST' && path === '/events/finish') {
      const payload = safeJsonParse<{ eventId?: string }>(await request.text());
      if (!payload.eventId) {
        return badRequest('eventId is required.');
      }

      await this.state.storage.put(`event:${payload.eventId}`, {
        status: 'done',
        updatedAt: nowIso(),
      } satisfies OrderStoreEventState);
      return json({ ok: true });
    }

    if (request.method === 'POST' && path === '/events/release') {
      const payload = safeJsonParse<{ eventId?: string }>(await request.text());
      if (!payload.eventId) {
        return badRequest('eventId is required.');
      }

      await this.state.storage.delete(`event:${payload.eventId}`);
      return json({ ok: true });
    }

    return badRequest('Not found.', 404);
  }
}

const handleWorkerError = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unexpected server error';
  const status =
    message.includes('required') ||
    message.includes('quantity') ||
    message.includes('Invalid') ||
    message.includes('items') ||
    message.includes('Product not found') ||
    message.includes('Variant unavailable')
      ? 400
      : message.includes('not found')
        ? 404
        : 422;

  return json({ error: message }, { status });
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      if (new URL(request.url).pathname.startsWith('/api/')) {
        return await handleApiRequest(request, env);
      }

      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      return badRequest('Not found.', 404);
    } catch (error) {
      return handleWorkerError(error);
    }
  },
};

export const __testables = {
  buildChargeSummary,
  buildCheckoutIdempotencyKey,
  defaultCurrencyForCountry,
  buildOrderConfirmationEmail,
  buildPrintfulWebhookEventId,
  buildStripeCheckoutBody,
  getProductDescription,
  normalizeStoreProduct,
  parseCheckoutIntentInput,
  parseCheckoutStartInput,
  parseShippingQuoteInput,
  resolveNextStatus,
};
