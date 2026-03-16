import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createPaymentService, _resetPaymentService } from '../index';
import { StripeAdapter } from '../StripeAdapter';

describe('createPaymentService factory', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    _resetPaymentService();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    _resetPaymentService();
  });

  it('returns StripeAdapter when PAYMENT_PROCESSOR=stripe', () => {
    process.env.PAYMENT_PROCESSOR = 'stripe';
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_factory_test';
    const service = createPaymentService();
    expect(service).toBeInstanceOf(StripeAdapter);
  });

  it('defaults to StripeAdapter when PAYMENT_PROCESSOR is not set', () => {
    delete process.env.PAYMENT_PROCESSOR;
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_factory_test';
    const service = createPaymentService();
    expect(service).toBeInstanceOf(StripeAdapter);
  });

  it('throws for StaxAdapter when STAX_API_KEY is missing', () => {
    process.env.PAYMENT_PROCESSOR = 'stax';
    delete process.env.STAX_API_KEY;
    expect(() => createPaymentService()).toThrow('STAX_API_KEY is required');
  });

  it('throws for unknown processor', () => {
    process.env.PAYMENT_PROCESSOR = 'paypal';
    expect(() => createPaymentService()).toThrow('Unknown PAYMENT_PROCESSOR');
  });

  it('returns singleton on repeated calls', () => {
    process.env.PAYMENT_PROCESSOR = 'stripe';
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_factory_test';
    const a = createPaymentService();
    const b = createPaymentService();
    expect(a).toBe(b);
  });
});
