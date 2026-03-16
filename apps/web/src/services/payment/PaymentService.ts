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
  createCustomer(input: CreateCustomerInput): Promise<CreateCustomerResult>;
  savePaymentMethod(input: SavePaymentMethodInput): Promise<SavePaymentMethodResult>;
  chargeCustomer(input: ChargeInput): Promise<ChargeResult>;
  refundTransaction(input: RefundInput): Promise<RefundResult>;
  getTransaction(transactionId: string): Promise<TransactionInfo>;
  listPaymentMethods(customerId: string): Promise<PaymentMethodInfo[]>;
  deletePaymentMethod(paymentMethodId: string): Promise<{ success: boolean }>;
  handleWebhook(rawBody: string | Buffer, signature: string): Promise<WebhookEvent>;
}
