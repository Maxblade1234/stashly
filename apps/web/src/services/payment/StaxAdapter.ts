import type { PaymentService } from './PaymentService';
import type {
  CreateCustomerInput, CreateCustomerResult,
  SavePaymentMethodInput, SavePaymentMethodResult,
  ChargeInput, ChargeResult,
  RefundInput, RefundResult,
  TransactionInfo, PaymentMethodInfo, WebhookEvent,
} from './types';

const NOT_IMPLEMENTED = 'StaxAdapter is not yet implemented. Set PAYMENT_PROCESSOR=stripe for development.';

export class StaxAdapter implements PaymentService {
  constructor() {
    const apiKey = process.env.STAX_API_KEY;
    if (!apiKey) {
      throw new Error('STAX_API_KEY is required when PAYMENT_PROCESSOR=stax');
    }
  }

  async createCustomer(_input: CreateCustomerInput): Promise<CreateCustomerResult> { throw new Error(NOT_IMPLEMENTED); }
  async savePaymentMethod(_input: SavePaymentMethodInput): Promise<SavePaymentMethodResult> { throw new Error(NOT_IMPLEMENTED); }
  async chargeCustomer(_input: ChargeInput): Promise<ChargeResult> { throw new Error(NOT_IMPLEMENTED); }
  async refundTransaction(_input: RefundInput): Promise<RefundResult> { throw new Error(NOT_IMPLEMENTED); }
  async getTransaction(_transactionId: string): Promise<TransactionInfo> { throw new Error(NOT_IMPLEMENTED); }
  async listPaymentMethods(_customerId: string): Promise<PaymentMethodInfo[]> { throw new Error(NOT_IMPLEMENTED); }
  async deletePaymentMethod(_paymentMethodId: string): Promise<{ success: boolean }> { throw new Error(NOT_IMPLEMENTED); }
  async handleWebhook(_rawBody: string | Buffer, _signature: string): Promise<WebhookEvent> { throw new Error(NOT_IMPLEMENTED); }
}
