export type PaymentProcessor = 'stripe' | 'stax';

export type ChargeStatus = 'succeeded' | 'pending' | 'failed';

export interface CreateCustomerInput {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface CreateCustomerResult {
  customerId: string;
  processorRef: string;
}

export interface SavePaymentMethodInput {
  customerId: string;
  tokenizedCard: string;
}

export interface SavePaymentMethodResult {
  paymentMethodId: string;
  last4: string;
  brand: string;
}

export interface ChargeInput {
  customerId: string;
  paymentMethodId: string;
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
  idempotencyKey?: string;
}

export interface ChargeResult {
  transactionId: string;
  status: ChargeStatus;
  processorRef: string;
}

export interface RefundInput {
  transactionId: string;
  amount?: number;
}

export interface RefundResult {
  refundId: string;
  status: 'succeeded' | 'pending' | 'failed';
  amount: number;
}

export interface TransactionInfo {
  id: string;
  status: ChargeStatus;
  amount: number;
  metadata: Record<string, string>;
}

export interface PaymentMethodInfo {
  id: string;
  last4: string;
  brand: string;
  isDefault: boolean;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

/** Wraps processor errors with a consistent shape for callers */
export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly processorCode?: string,
    public readonly isRetryable: boolean = false,
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}
