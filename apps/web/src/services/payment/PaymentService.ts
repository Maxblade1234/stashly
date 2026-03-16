import type {
  CreateCustomerInput,
  CreateCustomerResult,
  SavePaymentMethodInput,
  SavePaymentMethodResult,
  ChargeInput,
  ChargeResult,
  RefundInput,
  RefundResult,
  TransactionInfo,
  PaymentMethodInfo,
  WebhookEvent,
} from './types';

export interface PaymentService {
  /** Create a customer record in the payment processor */
  createCustomer(input: CreateCustomerInput): Promise<CreateCustomerResult>;

  /** Attach a tokenized card to a customer */
  savePaymentMethod(input: SavePaymentMethodInput): Promise<SavePaymentMethodResult>;

  /** Charge a customer's saved payment method */
  chargeCustomer(input: ChargeInput): Promise<ChargeResult>;

  /** Refund a transaction (full or partial) */
  refundTransaction(input: RefundInput): Promise<RefundResult>;

  /** Retrieve transaction details from the processor */
  getTransaction(transactionId: string): Promise<TransactionInfo>;

  /** List a customer's saved payment methods */
  listPaymentMethods(customerId: string): Promise<PaymentMethodInfo[]>;

  /** Remove a saved payment method */
  deletePaymentMethod(paymentMethodId: string): Promise<{ success: boolean }>;

  /** Verify webhook signature and normalize event */
  handleWebhook(rawBody: string | Buffer, signature: string): Promise<WebhookEvent>;
}
