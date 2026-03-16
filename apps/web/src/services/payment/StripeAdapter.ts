import Stripe from 'stripe';
import type { PaymentService } from './PaymentService';
import {
  type CreateCustomerInput, type CreateCustomerResult,
  type SavePaymentMethodInput, type SavePaymentMethodResult,
  type ChargeInput, type ChargeResult,
  type RefundInput, type RefundResult,
  type TransactionInfo, type PaymentMethodInfo, type WebhookEvent, type ChargeStatus,
  PaymentError,
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

  private wrapError(err: unknown, operation: string): never {
    if (err instanceof Stripe.errors.StripeError) {
      const isRetryable = err.type === 'StripeConnectionError' || err.type === 'StripeAPIError';
      throw new PaymentError(
        `${operation} failed: ${err.message}`,
        err.type,
        err.code ?? undefined,
        isRetryable,
      );
    }
    throw err;
  }

  private validateAmount(amount: number, operation: string): void {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new PaymentError(
        `${operation}: amount must be a positive integer (cents), got ${amount}`,
        'validation_error',
      );
    }
  }

  async createCustomer(input: CreateCustomerInput): Promise<CreateCustomerResult> {
    try {
      const customer = await this.stripe.customers.create({
        email: input.email, name: input.name, metadata: input.metadata,
      });
      return { customerId: customer.id, processorRef: customer.id };
    } catch (err) {
      this.wrapError(err, 'createCustomer');
    }
  }

  async savePaymentMethod(input: SavePaymentMethodInput): Promise<SavePaymentMethodResult> {
    try {
      const pm = await this.stripe.paymentMethods.attach(input.tokenizedCard, {
        customer: input.customerId,
      });
      await this.stripe.customers.update(input.customerId, {
        invoice_settings: { default_payment_method: pm.id },
      });
      return { paymentMethodId: pm.id, last4: pm.card?.last4 || '0000', brand: pm.card?.brand || 'unknown' };
    } catch (err) {
      this.wrapError(err, 'savePaymentMethod');
    }
  }

  async chargeCustomer(input: ChargeInput): Promise<ChargeResult> {
    this.validateAmount(input.amount, 'chargeCustomer');
    try {
      const requestOptions: Stripe.RequestOptions = {};
      if (input.idempotencyKey) {
        requestOptions.idempotencyKey = input.idempotencyKey;
      }
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: input.amount, currency: input.currency,
        customer: input.customerId, payment_method: input.paymentMethodId,
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
        metadata: input.metadata,
      }, requestOptions);
      return { transactionId: paymentIntent.id, status: mapStatus(paymentIntent.status), processorRef: paymentIntent.id };
    } catch (err) {
      this.wrapError(err, 'chargeCustomer');
    }
  }

  async refundTransaction(input: RefundInput): Promise<RefundResult> {
    if (input.amount !== undefined) {
      this.validateAmount(input.amount, 'refundTransaction');
    }
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: input.transactionId, amount: input.amount,
      });
      const refundStatus = refund.status === 'succeeded' ? 'succeeded' as const
        : refund.status === 'failed' || refund.status === 'canceled' ? 'failed' as const
        : 'pending' as const;
      return { refundId: refund.id, status: refundStatus, amount: refund.amount ?? 0 };
    } catch (err) {
      this.wrapError(err, 'refundTransaction');
    }
  }

  async getTransaction(transactionId: string): Promise<TransactionInfo> {
    try {
      const pi = await this.stripe.paymentIntents.retrieve(transactionId);
      return { id: pi.id, status: mapStatus(pi.status), amount: pi.amount, metadata: (pi.metadata as Record<string, string>) || {} };
    } catch (err) {
      this.wrapError(err, 'getTransaction');
    }
  }

  async listPaymentMethods(customerId: string): Promise<PaymentMethodInfo[]> {
    try {
      const methods = await this.stripe.customers.listPaymentMethods(customerId, { type: 'card' });
      const customer = await this.stripe.customers.retrieve(customerId);
      const defaultPm = typeof customer !== 'string' && !customer.deleted
        ? (customer.invoice_settings?.default_payment_method as string | null) : null;
      return methods.data.map(pm => ({
        id: pm.id, last4: pm.card?.last4 || '0000', brand: pm.card?.brand || 'unknown', isDefault: pm.id === defaultPm,
      }));
    } catch (err) {
      this.wrapError(err, 'listPaymentMethods');
    }
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<{ success: boolean }> {
    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);
      return { success: true };
    } catch (err) {
      this.wrapError(err, 'deletePaymentMethod');
    }
  }

  async handleWebhook(rawBody: string | Buffer, signature: string): Promise<WebhookEvent> {
    if (!this.webhookSecret) {
      throw new PaymentError('STRIPE_WEBHOOK_SECRET is required for webhook verification', 'configuration_error');
    }
    try {
      const event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
      return { id: event.id, type: event.type, data: event.data.object as unknown as Record<string, unknown> };
    } catch (err) {
      this.wrapError(err, 'handleWebhook');
    }
  }
}
