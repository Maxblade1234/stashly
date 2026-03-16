import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { StripeAdapter } from '../StripeAdapter';

const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;

describe.skipIf(!hasStripeKey)('StripeAdapter integration', () => {
  let adapter: StripeAdapter;
  let testCustomerId: string;
  let testPaymentMethodId: string;
  let testChargeId: string;

  beforeAll(() => {
    adapter = new StripeAdapter();
  });

  it('creates a customer', async () => {
    const result = await adapter.createCustomer({
      email: `test-${Date.now()}@stashly.com`,
      name: 'Stashly Test User',
      metadata: { source: 'integration-test' },
    });
    expect(result.customerId).toBeTruthy();
    expect(result.customerId).toMatch(/^cus_/);
    expect(result.processorRef).toBe(result.customerId);
    testCustomerId = result.customerId;
  });

  it('saves a payment method', async () => {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const pm = await stripe.paymentMethods.create({
      type: 'card',
      card: { number: '4242424242424242', exp_month: 12, exp_year: 2030, cvc: '123' },
    });
    const result = await adapter.savePaymentMethod({
      customerId: testCustomerId, tokenizedCard: pm.id,
    });
    expect(result.paymentMethodId).toMatch(/^pm_/);
    expect(result.last4).toBe('4242');
    expect(result.brand).toBe('visa');
    testPaymentMethodId = result.paymentMethodId;
  });

  it('lists payment methods', async () => {
    const methods = await adapter.listPaymentMethods(testCustomerId);
    expect(methods.length).toBeGreaterThanOrEqual(1);
    const found = methods.find(m => m.id === testPaymentMethodId);
    expect(found).toBeTruthy();
    expect(found!.last4).toBe('4242');
    expect(found!.isDefault).toBe(true);
  });

  it('charges a customer', async () => {
    const result = await adapter.chargeCustomer({
      customerId: testCustomerId, paymentMethodId: testPaymentMethodId,
      amount: 4450, currency: 'usd',
      metadata: { retailer: 'Apple', type: 'gift_card_purchase' },
    });
    expect(result.transactionId).toMatch(/^pi_/);
    expect(result.status).toBe('succeeded');
    expect(result.processorRef).toBe(result.transactionId);
    testChargeId = result.transactionId;
  });

  it('retrieves a transaction', async () => {
    const info = await adapter.getTransaction(testChargeId);
    expect(info.id).toBe(testChargeId);
    expect(info.status).toBe('succeeded');
    expect(info.amount).toBe(4450);
    expect(info.metadata.retailer).toBe('Apple');
  });

  it('refunds a transaction', async () => {
    const result = await adapter.refundTransaction({
      transactionId: testChargeId, amount: 2000,
    });
    expect(result.refundId).toMatch(/^re_/);
    expect(result.status).toBe('succeeded');
    expect(result.amount).toBe(2000);
  });

  it('deletes a payment method', async () => {
    const result = await adapter.deletePaymentMethod(testPaymentMethodId);
    expect(result.success).toBe(true);
    const methods = await adapter.listPaymentMethods(testCustomerId);
    const found = methods.find(m => m.id === testPaymentMethodId);
    expect(found).toBeUndefined();
  });

  afterAll(async () => {
    if (testCustomerId) {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      await stripe.customers.del(testCustomerId).catch(() => {});
    }
  });
});

describe('StripeAdapter constructor validation', () => {
  it('throws if STRIPE_SECRET_KEY is missing', () => {
    const original = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    expect(() => new StripeAdapter()).toThrow('STRIPE_SECRET_KEY is required');
    if (original) process.env.STRIPE_SECRET_KEY = original;
  });
});
