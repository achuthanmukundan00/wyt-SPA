import { getStoreProducts } from '../../_lib/printfulClient';

const sendJson = (res: any, statusCode: number, body: unknown) => {
  res.status(statusCode).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(body));
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const products = await getStoreProducts();
    return sendJson(res, 200, { products });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    console.error('[store/products] fetch error', { message });
    return sendJson(res, 500, { error: 'Unable to load store products.' });
  }
}
