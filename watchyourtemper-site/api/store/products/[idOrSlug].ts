import { getStoreProductByIdOrSlug } from '../../_lib/printfulClient';

const sendJson = (res: any, statusCode: number, body: unknown) => {
  res.status(statusCode).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(body));
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const idOrSlug = typeof req.query?.idOrSlug === 'string' ? req.query.idOrSlug : '';

  if (!idOrSlug) {
    return sendJson(res, 400, { error: 'Missing product identifier.' });
  }

  try {
    const product = await getStoreProductByIdOrSlug(idOrSlug);

    if (!product) {
      return sendJson(res, 404, { error: 'Product not found.' });
    }

    return sendJson(res, 200, { product });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    console.error('[store/products/:idOrSlug] fetch error', { idOrSlug, message });
    return sendJson(res, 500, { error: 'Unable to load store product.' });
  }
}
