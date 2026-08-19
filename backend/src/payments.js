import crypto from 'node:crypto';

export function razorpaySignature(orderId, paymentId, secret) {
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

export function verifyWebhookSignature(rawBody, signature, secret) {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return Boolean(signature) && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function assertPaymentSignature(orderId, paymentId, signature, secret) {
  return razorpaySignature(orderId, paymentId, secret) === signature;
}
