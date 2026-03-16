import type { PaymentService } from './PaymentService';
import { StripeAdapter } from './StripeAdapter';
import { StaxAdapter } from './StaxAdapter';

export type { PaymentService } from './PaymentService';
export * from './types';

let instance: PaymentService | null = null;

export function createPaymentService(): PaymentService {
  if (instance) return instance;

  const processor = process.env.PAYMENT_PROCESSOR || 'stripe';

  switch (processor) {
    case 'stripe':
      instance = new StripeAdapter();
      break;
    case 'stax':
      instance = new StaxAdapter();
      break;
    default:
      throw new Error(`Unknown PAYMENT_PROCESSOR: "${processor}". Must be "stripe" or "stax".`);
  }

  return instance;
}

export function _resetPaymentService(): void {
  instance = null;
}
