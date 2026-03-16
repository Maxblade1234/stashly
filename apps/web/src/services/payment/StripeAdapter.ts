import Stripe from 'stripe';
import type { PaymentService } from './PaymentService';
import type {
  CreateCustomerInput, CreateCustomerResult,
  SavePaymentMethodInput, SavePaymentMethodResult,
  ChargeInput, ChargeResult,
  RefundInput, RefundResult,
  TransactionInfo, PaymentMethodInfo, WebhookEvent, ChargeStatus,
} from './types';

function mapStatus(status: Stripe.PaymentIntent.Status): ChargeStatus {
  switch (status) {
    case 'succeeded': return 'succeeded';
    case 'processing':
    case 'requires_action':
    case 'requires_confirmation':
    case 'requires_payment_method': return 'pending';
    default: return 'failed';
  }
}

export class StripeAdapter implements PaymentService {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required when PAYMENT_PROCESSOR=stripe');
    }
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    this.stripe = new Stripe(secretKey);
  }

  async createCustomer(input: CreateCustomerInput): Promise<CreateCustomerResult> {
    const customer = await this.stripe.customers.create({
      email: input.email, name: input.name, metadata: input.metadata,
    });
    return { customerId: customer.id, processorRef: customer.id };
  }

  async savePaymentMethod(input: SavePaymentMethodInput): Promise<SavePaymentMethodResult> {
    const pm = await this.stripe.paymentMethods.attach(input.tokenizedCard, {
      customer: input.customerId,
    });
    await this.stripe.customers.update(input.customerId, {
      invoice_settings: { default_payment_method: pm.id },
    });
    return { paymentMethodId: pm.id, last4: pm.card?.last4 || '0000', brand: pm.card?.brand || 'unknown' };
  }

  async chargeCustomer(input: ChargeInput): Promise<ChargeResult> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: input.amount, currency: input.currency,
      customer: input.customerId, payment_method: input.paymentMethodId,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      metadata: input.metadata,
    });
    return { transactionId: paymentIntent.id, status: mapStatus(paymentIntent.status), processorRef: paymentIntent.id };
  }

  async refundTransaction(input: RefundInput): Promise<RefundResult> {
    const refund = await this.stripe.refunds.create({
      payment_intent: input.transactionId, amount: input.amount,
    });
    const refundStatus = refund.status === 'succeeded' ? 'succeeded' as const
      : refund.status === 'failed' || refund.status === 'canceled' ? 'failed' as const
      : 'pending' as const;
    return { refundId: refund.id, status: refundStatus, amount: refund.amount };
  }

  async getTransaction(transactionId: string): Promise<TransactionInfo> {
    const pi = await this.stripe.paymentIntents.retrieve(transactionId);
    return { id: pi.id, status: mapStatus(pi.status), amount: pi.amount, metadata: (pi.metadata as Record<string, string>) || {} };
  }

  async listPaymentMethods(customerId: string): Promise<PaymentMethodInfo[]> {
    const methods = await this.stripe.customers.listPaymentMethods(customerId, { type: 'card' });
    const customer = await this.stripe.customers.retrieve(customerId);
    const defaultPm = typeof customer !== 'string' && !customer.deleted
      ? (customer.invoice_settings?.default_payment_method as string | null) : null;
    return methods.data.map(pm => ({
      id: pm.id, last4: pm.card?.last4 || '0000', brand: pm.card?.brand || 'unknown', isDefault: pm.id === defaultPm,
    }));
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<{ success: boolean }> {
    await this.stripe.paymentMethods.detach(paymentMethodId);
    return { success: true };
  }

  async handleWebhook(rawBody: string | Buffer, signature: string): Promise<WebhookEvent> {
    if (!this.webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required for webhook verification');
    }
    const event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    return { id: event.id, type: event.type, data: event.data.object as unknown as Record<string, unknown> };
  }
}
