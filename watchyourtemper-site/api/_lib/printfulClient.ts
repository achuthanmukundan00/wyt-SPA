const PRINTFUL_API_BASE = 'https://api.printful.com';
const REQUEST_TIMEOUT_MS = 8000;

type PrintfulEnvelope<T> = {
  code: number;
  result: T;
  error?: { reason?: string; message?: string };
};

type PrintfulSyncVariant = {
  id: number;
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

type PrintfulStoreProductListItem = {
  sync_product: PrintfulSyncProduct;
  sync_variants: PrintfulSyncVariant[];
};

type PrintfulStoreProductResult = {
  sync_product: PrintfulSyncProduct;
  sync_variants: PrintfulSyncVariant[];
};

const parseVariantName = (name: string): { color: string; size: string } => {
  const parts = name.split('/').map((item) => item.trim()).filter(Boolean);
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

const getAccessToken = (): string => {
  const token = process.env.PRINTFUL_TOKEN;
  if (!token) {
    throw new Error('Missing PRINTFUL_TOKEN environment variable.');
  }

  return token;
};

const printfulRequest = async <T>(path: string): Promise<T> => {
  const token = getAccessToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${PRINTFUL_API_BASE}${path}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    const payload = (await response.json()) as PrintfulEnvelope<T>;

    if (!response.ok || payload.code !== 200) {
      const reason = payload.error?.reason || payload.error?.message || `HTTP ${response.status}`;
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

export const normalizeStoreProduct = (
  payload: PrintfulStoreProductListItem | PrintfulStoreProductResult,
) => {
  const syncProduct = payload.sync_product;

  return {
    id: String(syncProduct.id),
    slug: normalizeProductSlug(syncProduct.name, syncProduct.id),
    title: syncProduct.name,
    description: 'Official watchyourtemper merch item.',
    image: syncProduct.thumbnail_url || '',
    variants: payload.sync_variants.map((variant) => {
      const parsed = parseVariantName(variant.name);
      const retailPrice = Number.parseFloat(variant.retail_price);

      return {
        id: String(variant.id),
        name: variant.name,
        size: parsed.size,
        color: parsed.color,
        price: Number.isFinite(retailPrice) ? retailPrice : 0,
        currency: variant.currency || 'USD',
        availability: !variant.is_ignored && variant.availability_status !== 'discontinued',
      };
    }),
  };
};

export const getStoreProducts = async () => {
  const result = await printfulRequest<PrintfulStoreProductListItem[]>('/store/products');

  return result.map((item) => normalizeStoreProduct(item)).filter((item) => item.variants.length > 0);
};

export const getStoreProductByIdOrSlug = async (idOrSlug: string) => {
  if (/^\d+$/.test(idOrSlug)) {
    try {
      const result = await printfulRequest<PrintfulStoreProductResult>(`/store/products/${idOrSlug}`);
      return normalizeStoreProduct(result);
    } catch {
      // fallback to slug scan below
    }
  }

  const products = await getStoreProducts();
  return products.find((item) => item.id === idOrSlug || item.slug === idOrSlug) || null;
};
