import { buildCheckoutIntent, parseCheckoutInput } from '../_lib/checkout';

const sendJson = (res: any, statusCode: number, body: unknown) => {
  res.status(statusCode).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(body));
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const input = parseCheckoutInput(req.body);
    const intent = await buildCheckoutIntent(input);

    return sendJson(res, 200, { intent });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    const status = message.includes('required') || message.includes('quantity') ? 400 : 422;

    return sendJson(res, status, { error: message });
  }
}
