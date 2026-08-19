import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { assertPaymentSignature, razorpaySignature, verifyWebhookSignature } from '../src/payments.js';

test('Razorpay checkout signature verifies only the exact order/payment pair', () => {
  const secret='test-secret';
  const order='order_123';
  const payment='pay_456';
  const signature=razorpaySignature(order,payment,secret);
  assert.equal(assertPaymentSignature(order,payment,signature,secret),true);
  assert.equal(assertPaymentSignature(order,'pay_other',signature,secret),false);
});

test('Razorpay webhook signature verifies the raw payload', () => {
  const secret='webhook-secret';
  const raw='{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_1"}}}}';
  const signature=crypto.createHmac('sha256',secret).update(raw).digest('hex');
  assert.equal(verifyWebhookSignature(raw,signature,secret),true);
  assert.equal(verifyWebhookSignature(raw+' ',signature,secret),false);
});
