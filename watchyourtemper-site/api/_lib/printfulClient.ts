const PRINTFUL_API_BASE = 'https://api.printful.com';
const REQUEST_TIMEOUT_MS = 8000;

type PrintfulEnvelope<T> = {
  code: number;
  result: T;
  error?: { reason?: string; message?: string };
};

type PrintfulProductListItem = {
  id: number;
  external_id?: string;
  name: string;
  variants?: number;
  synced?: number;
  thumbnail_url?: string;
  is_ignored?: boolean;
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

type PrintfulProductDetail = {
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

const normalizeDetailedStoreProduct = (payload: PrintfulProductDetail) => {
  const syncProduct = payload.sync_product;
  const syncVariants = Array.isArray(payload.sync_variants) ? payload.sync_variants : [];

  return {
    id: String(syncProduct.id),
    slug: normalizeProductSlug(syncProduct.name, syncProduct.id),
    title: syncProduct.name,
    description: 'Official watchyourtemper merch item.',
    image: syncProduct.thumbnail_url || '',
    variants: syncVariants.map((variant) => {
      const parsed = parseVariantName(variant.name || '');
      const retailPrice = Number.parseFloat(variant.retail_price);

      return {
        id: String(variant.id),
        name: variant.name || 'Default',
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
  const summaries = await printfulRequest<PrintfulProductListItem[]>('/store/products');

  const detailedProducts = await Promise.all(
    summaries
      .filter((item) => !item.is_ignored)
      .map(async (item) => {
        try {
          const detail = await printfulRequest<PrintfulProductDetail>(`/store/products/${item.id}`);
          return normalizeDetailedStoreProduct(detail);
        } catch (error) {
          console.error('[printful] failed to load product detail', item.id, error);
          return null;
        }
      }),
  );

  return detailedProducts
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => item.variants.length > 0);
};

export const getStoreProductByIdOrSlug = async (idOrSlug: string) => {
  if (/^\d+$/.test(idOrSlug)) {
    try {
      const detail = await printfulRequest<PrintfulProductDetail>(`/store/products/${idOrSlug}`);
      return normalizeDetailedStoreProduct(detail);
    } catch {
      // fallback below
    }
  }

  const products = await getStoreProducts();
  return products.find((item) => item.id === idOrSlug || item.slug === idOrSlug) || null;
};