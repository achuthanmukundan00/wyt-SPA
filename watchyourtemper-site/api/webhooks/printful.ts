import { getWebhookRawBody, handlePrintfulWebhook } from '../_lib/webhooks';

const sendJson = (res: any, statusCode: number, body: unknown) => {
  res.status(statusCode).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(body));
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const rawBody = getWebhookRawBody(req.body);
    const signature = req.headers?.['x-printful-signature'] || req.headers?.['x-printful-webhook-signature'];
    const authorization = req.headers?.authorization;
    const result = await handlePrintfulWebhook(rawBody, signature, authorization);

    return sendJson(res, 200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    return sendJson(res, 400, { error: message });
  }
}
