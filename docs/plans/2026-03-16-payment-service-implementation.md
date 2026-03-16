# Payment Service Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a processor-agnostic payment service layer with a working Stripe adapter, database schema updates, and integration tests.

**Architecture:** A `PaymentService` TypeScript interface with 8 methods, implemented by `StripeAdapter` (using Stripe's PaymentIntents API) and a `StaxAdapter` stub. A factory function reads `PAYMENT_PROCESSOR` env var, validates required credentials, and returns the correct adapter as a singleton. Database schema extended with processor-agnostic columns via a new Supabase migration.

**Tech Stack:** TypeScript, Stripe SDK (`stripe` npm package), Vitest, Supabase (PostgreSQL).

**Design Doc:** `docs/plans/2026-03-16-payment-service-design.md`

---

## Task 1: Payment service types

**Files:**
- Create: `apps/web/src/services/payment/types.ts`

**Step 1: Create the types file**

All types used by the PaymentService interface and its adapters. These are backend-only types — not exposed to the frontend.

```typescript
// apps/web/src/services/payment/types.ts

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
  amount: number; // in cents
  currency: string;
  metadata?: Record<string, string>;
}

export interface ChargeResult {
  transactionId: string;
  status: ChargeStatus;
  processorRef: string;
}

export interface RefundInput {
  transactionId: string;
  amount?: number; // in cents, omit for full refund
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
```

**Step 2: Commit**

```bash
git add apps/web/src/services/payment/types.ts
git commit -m "feat: add payment service types"
```

---

## Task 2: PaymentService interface

**Files:**
- Create: `apps/web/src/services/payment/PaymentService.ts`

**Step 1: Create the abstract interface**

This is the contract that all payment adapters must implement. Application code only imports this interface, never adapter-specific code.

```typescript
// apps/web/src/services/payment/PaymentService.ts

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
```

**Step 2: Commit**

```bash
git add apps/web/src/services/payment/PaymentService.ts
git commit -m "feat: add PaymentService interface contract"
```

---

## Task 3: Stripe adapter

**Files:**
- Create: `apps/web/src/services/payment/StripeAdapter.ts`

**Step 1: Install Stripe SDK**

Run: `cd apps/web && npm install stripe`

**Step 2: Create the Stripe adapter**

Implements all 8 interface methods using the official Stripe SDK. Uses PaymentIntents API (not legacy Charges).

```typescript
// apps/web/src/services/payment/StripeAdapter.ts

import Stripe from 'stripe';
import type { PaymentService } from './PaymentService';
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
  ChargeStatus,
} from './types';

function mapStatus(status: Stripe.PaymentIntent.Status): ChargeStatus {
  switch (status) {
    case 'succeeded':
      return 'succeeded';
    case 'processing':
    case 'requires_action':
    case 'requires_confirmation':
    case 'requires_payment_method':
      return 'pending';
    default:
      return 'failed';
  }
}

export class StripeAdapter implements PaymentService {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error(
        'STRIPE_SECRET_KEY is required when PAYMENT_PROCESSOR=stripe'
      );
    }
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    this.stripe = new Stripe(secretKey);
  }

  async createCustomer(input: CreateCustomerInput): Promise<CreateCustomerResult> {
    const customer = await this.stripe.customers.create({
      email: input.email,
      name: input.name,
      metadata: input.metadata,
    });

    return {
      customerId: customer.id,
      processorRef: customer.id,
    };
  }

  async savePaymentMethod(input: SavePaymentMethodInput): Promise<SavePaymentMethodResult> {
    // Attach the payment method to the customer
    const pm = await this.stripe.paymentMethods.attach(input.tokenizedCard, {
      customer: input.customerId,
    });

    // Set as default payment method
    await this.stripe.customers.update(input.customerId, {
      invoice_settings: { default_payment_method: pm.id },
    });

    return {
      paymentMethodId: pm.id,
      last4: pm.card?.last4 || '0000',
      brand: pm.card?.brand || 'unknown',
    };
  }

  async chargeCustomer(input: ChargeInput): Promise<ChargeResult> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: input.amount,
      currency: input.currency,
      customer: input.customerId,
      payment_method: input.paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      metadata: input.metadata,
    });

    return {
      transactionId: paymentIntent.id,
      status: mapStatus(paymentIntent.status),
      processorRef: paymentIntent.id,
    };
  }

  async refundTransaction(input: RefundInput): Promise<RefundResult> {
    const refund = await this.stripe.refunds.create({
      payment_intent: input.transactionId,
      amount: input.amount, // undefined = full refund
    });

    return {
      refundId: refund.id,
      status: refund.status === 'succeeded' ? 'succeeded' : 'pending',
      amount: refund.amount,
    };
  }

  async getTransaction(transactionId: string): Promise<TransactionInfo> {
    const pi = await this.stripe.paymentIntents.retrieve(transactionId);

    return {
      id: pi.id,
      status: mapStatus(pi.status),
      amount: pi.amount,
      metadata: (pi.metadata as Record<string, string>) || {},
    };
  }

  async listPaymentMethods(customerId: string): Promise<PaymentMethodInfo[]> {
    const methods = await this.stripe.customers.listPaymentMethods(customerId, {
      type: 'card',
    });

    // Get customer's default payment method
    const customer = await this.stripe.customers.retrieve(customerId);
    const defaultPm =
      typeof customer !== 'string' && !customer.deleted
        ? (customer.invoice_settings?.default_payment_method as string | null)
        : null;

    return methods.data.map((pm) => ({
      id: pm.id,
      last4: pm.card?.last4 || '0000',
      brand: pm.card?.brand || 'unknown',
      isDefault: pm.id === defaultPm,
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

    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.webhookSecret
    );

    return {
      id: event.id,
      type: event.type,
      data: event.data.object as unknown as Record<string, unknown>,
    };
  }
}
```

**Step 3: Commit**

```bash
git add apps/web/src/services/payment/StripeAdapter.ts apps/web/package.json package-lock.json
git commit -m "feat: add StripeAdapter implementing PaymentService interface"
```

---

## Task 4: Stax adapter stub

**Files:**
- Create: `apps/web/src/services/payment/StaxAdapter.ts`

**Step 1: Create the stub**

All methods throw a clear error. This ensures the factory compiles and the interface is satisfied, without dead code.

```typescript
// apps/web/src/services/payment/StaxAdapter.ts

import type { PaymentService } from './PaymentService';
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

const NOT_IMPLEMENTED = 'StaxAdapter is not yet implemented. Set PAYMENT_PROCESSOR=stripe for development.';

export class StaxAdapter implements PaymentService {
  constructor() {
    // Validate Stax credentials would go here
    const apiKey = process.env.STAX_API_KEY;
    if (!apiKey) {
      throw new Error('STAX_API_KEY is required when PAYMENT_PROCESSOR=stax');
    }
  }

  async createCustomer(_input: CreateCustomerInput): Promise<CreateCustomerResult> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async savePaymentMethod(_input: SavePaymentMethodInput): Promise<SavePaymentMethodResult> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async chargeCustomer(_input: ChargeInput): Promise<ChargeResult> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async refundTransaction(_input: RefundInput): Promise<RefundResult> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async getTransaction(_transactionId: string): Promise<TransactionInfo> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async listPaymentMethods(_customerId: string): Promise<PaymentMethodInfo[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async deletePaymentMethod(_paymentMethodId: string): Promise<{ success: boolean }> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async handleWebhook(_rawBody: string | Buffer, _signature: string): Promise<WebhookEvent> {
    throw new Error(NOT_IMPLEMENTED);
  }
}
```

**Step 2: Commit**

```bash
git add apps/web/src/services/payment/StaxAdapter.ts
git commit -m "feat: add StaxAdapter stub with not-implemented errors"
```

---

## Task 5: Factory and barrel export

**Files:**
- Create: `apps/web/src/services/payment/index.ts`

**Step 1: Create the factory**

Reads `PAYMENT_PROCESSOR` env var, validates credentials, returns a singleton adapter instance.

```typescript
// apps/web/src/services/payment/index.ts

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
      throw new Error(
        `Unknown PAYMENT_PROCESSOR: "${processor}". Must be "stripe" or "stax".`
      );
  }

  return instance;
}

/**
 * Reset singleton — only used in tests.
 */
export function _resetPaymentService(): void {
  instance = null;
}
```

**Step 2: Commit**

```bash
git add apps/web/src/services/payment/index.ts
git commit -m "feat: add payment service factory with env var switching"
```

---

## Task 6: Database migration

**Files:**
- Create: `apps/web/supabase/migrations/002_payment_processor_columns.sql`

**Step 1: Write the migration**

Adds processor-agnostic columns to `profiles`, `payment_methods`, and `transactions`. All nullable — no data loss, no breaking changes.

```sql
-- 002_payment_processor_columns.sql
-- Adds processor-agnostic payment columns

-- Profiles: track which processor and external customer ID
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payment_processor text,
  ADD COLUMN IF NOT EXISTS processor_customer_id text;

-- Payment methods: track which processor holds this method
ALTER TABLE public.payment_methods
  ADD COLUMN IF NOT EXISTS processor text;

-- Transactions: full processor tracking
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS processor text,
  ADD COLUMN IF NOT EXISTS processor_transaction_id text,
  ADD COLUMN IF NOT EXISTS processor_refund_id text,
  ADD COLUMN IF NOT EXISTS payment_method_id uuid references public.payment_methods(id),
  ADD COLUMN IF NOT EXISTS processor_fee numeric(10, 2),
  ADD COLUMN IF NOT EXISTS net_amount numeric(10, 2);

-- Index for payment method lookups
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method
  ON public.transactions(payment_method_id);

-- Index for processor transaction lookups (webhook reconciliation)
CREATE INDEX IF NOT EXISTS idx_transactions_processor_txn_id
  ON public.transactions(processor_transaction_id);
```

**Step 2: Commit**

```bash
git add apps/web/supabase/migrations/002_payment_processor_columns.sql
git commit -m "feat: add payment processor columns migration"
```

---

## Task 7: Update shared types

**Files:**
- Modify: `packages/shared/src/types.ts`

**Step 1: Add payment-related types and update Transaction interface**

Add `PaymentProcessor` type alias, `PaymentMethodInfo` interface, and new optional fields on `Transaction` and `UserProfile`.

At the end of the existing file, add:

```typescript
// Payment types
export type PaymentProcessor = 'stripe' | 'stax';

export interface PaymentMethodInfo {
  id: string;
  last4: string;
  brand: string;
  isDefault: boolean;
}
```

Update the existing `Transaction` interface to add the new optional fields:

```typescript
export interface Transaction {
  id: string;
  user_id: string;
  retailer_id: string;
  cards_purchased: CardPurchased[];
  total_paid: number;
  total_value: number;
  savings: number;
  residual_balance: number;
  status: TransactionStatus;
  payment_processor_id: string | null;
  demo: boolean;
  created_at: string;
  // Payment processor fields (Phase 1)
  processor?: PaymentProcessor;
  processor_transaction_id?: string;
  processor_refund_id?: string;
  payment_method_id?: string;
  processor_fee?: number;
  net_amount?: number;
}
```

Update the existing `UserProfile` interface to add processor fields:

```typescript
export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  savings_total: number;
  role: UserRole;
  created_at: string;
  // Payment processor fields (Phase 1)
  payment_processor?: PaymentProcessor;
  processor_customer_id?: string;
}
```

**Step 2: Commit**

```bash
git add packages/shared/src/types.ts
git commit -m "feat: add payment processor types to shared package"
```

---

## Task 8: Update .env.example

**Files:**
- Modify: `.env.example`

**Step 1: Replace the TBD payment section**

Replace the existing `# Payment Processor (TBD)` section with specific processor env vars:

```bash
# Payment Processor
PAYMENT_PROCESSOR=stripe

# Stripe (dev/test only — gift card sales prohibited in production)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stax (production — for Phase 3)
STAX_API_KEY=
STAX_MERCHANT_ID=
STAX_JS_PUBLIC_KEY=
STAX_WEBHOOK_SECRET=
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "feat: add payment processor env vars to .env.example"
```

---

## Task 9: Stripe adapter integration tests

**Files:**
- Create: `apps/web/src/services/payment/__tests__/stripe-adapter.test.ts`

**Step 1: Write integration tests**

Tests run against Stripe test mode with real API calls. Skipped automatically if `STRIPE_SECRET_KEY` is not set (safe for CI without credentials).

```typescript
// apps/web/src/services/payment/__tests__/stripe-adapter.test.ts

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
    // Create a test payment method token via Stripe API
    // In real usage, this token comes from Stripe Elements on the frontend.
    // For testing, we create a PaymentMethod directly with a test card.
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const pm = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2030,
        cvc: '123',
      },
    });

    const result = await adapter.savePaymentMethod({
      customerId: testCustomerId,
      tokenizedCard: pm.id,
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
      customerId: testCustomerId,
      paymentMethodId: testPaymentMethodId,
      amount: 4450, // $44.50 in cents
      currency: 'usd',
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
      transactionId: testChargeId,
      amount: 2000, // partial refund: $20.00
    });

    expect(result.refundId).toMatch(/^re_/);
    expect(result.status).toBe('succeeded');
    expect(result.amount).toBe(2000);
  });

  it('deletes a payment method', async () => {
    const result = await adapter.deletePaymentMethod(testPaymentMethodId);
    expect(result.success).toBe(true);

    // Verify it's gone
    const methods = await adapter.listPaymentMethods(testCustomerId);
    const found = methods.find(m => m.id === testPaymentMethodId);
    expect(found).toBeUndefined();
  });

  afterAll(async () => {
    // Clean up: delete test customer
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

    // Restore
    if (original) process.env.STRIPE_SECRET_KEY = original;
  });
});
```

**Step 2: Run tests to verify they pass (or skip if no key)**

Run: `cd apps/web && npx vitest run src/services/payment/__tests__/stripe-adapter.test.ts`

Expected: Tests skip if no `STRIPE_SECRET_KEY`, or pass if key is set.

**Step 3: Commit**

```bash
git add apps/web/src/services/payment/__tests__/stripe-adapter.test.ts
git commit -m "test: add Stripe adapter integration tests"
```

---

## Task 10: Factory tests

**Files:**
- Create: `apps/web/src/services/payment/__tests__/factory.test.ts`

**Step 1: Write factory unit tests**

Tests the factory pattern: env var switching, default behavior, unknown processor error, singleton behavior.

```typescript
// apps/web/src/services/payment/__tests__/factory.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createPaymentService, _resetPaymentService } from '../index';
import { StripeAdapter } from '../StripeAdapter';
import { StaxAdapter } from '../StaxAdapter';

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
```

**Step 2: Run tests**

Run: `cd apps/web && npx vitest run src/services/payment/__tests__/factory.test.ts`

Expected: All 5 tests pass.

**Step 3: Commit**

```bash
git add apps/web/src/services/payment/__tests__/factory.test.ts
git commit -m "test: add payment service factory unit tests"
```

---

## Task 11: Build verification and final commit

**Step 1: Run all web app tests**

Run: `cd apps/web && npx vitest run`

Expected: All existing tests (6 stacking) + new tests (5 factory + constructor validation) pass. Stripe integration tests skip if no key.

**Step 2: Verify Next.js build**

Run: `cd apps/web && npx next build`

Expected: Build succeeds with no TypeScript errors.

**Step 3: Push to GitHub**

Run: `git push origin feature/mvp-implementation`
