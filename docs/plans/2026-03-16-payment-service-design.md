# Stashly Payment Service — Phase 1 Design

> Processor-agnostic payment architecture with Stripe adapter for dev/test.

**Approved:** 2026-03-16
**Scope:** Phase 1 only (service abstraction + Stripe adapter + DB schema)
**Reference:** `stashly_payment_spec.md (external)`

---

## Architecture

A `PaymentService` interface abstracts all payment processing. Application code interacts only with this interface. A factory reads `PAYMENT_PROCESSOR` env var and returns the correct adapter. Phase 1 implements Stripe; Stax is a stub.

## File Structure

```
apps/web/src/services/payment/
├── PaymentService.ts          # Abstract interface (8 methods)
├── StripeAdapter.ts           # Stripe implementation (dev/test)
├── StaxAdapter.ts             # Stub (throws "not implemented")
├── types.ts                   # Payment-specific types
├── index.ts                   # Factory with env var switching
└── __tests__/
    └── stripe-adapter.test.ts # Integration tests against Stripe test mode
```

## Interface Contract

| Method | Input | Output |
|---|---|---|
| createCustomer() | email, name, metadata | { customerId, processorRef } |
| savePaymentMethod() | customerId, tokenizedCard | { paymentMethodId, last4, brand } |
| chargeCustomer() | customerId, paymentMethodId, amount, currency, metadata | { transactionId, status, processorRef } |
| refundTransaction() | transactionId, amount (optional) | { refundId, status, amount } |
| getTransaction() | transactionId | { id, status, amount, metadata } |
| listPaymentMethods() | customerId | [ { id, last4, brand, isDefault } ] |
| deletePaymentMethod() | paymentMethodId | { success: boolean } |
| handleWebhook() | rawBody, signature, secret | { event, type, data } |

## Database Schema Changes

New migration `002_payment_processor_columns.sql`. All new columns nullable — no data loss.

**profiles — add:**
- `payment_processor` VARCHAR(20) — which processor this user is on
- `processor_customer_id` VARCHAR(255) — customer ID in Stripe/Stax

**payment_methods — add:**
- `processor` VARCHAR(20) — which processor holds this method

**transactions — add:**
- `processor` VARCHAR(20) — which processor handled this
- `processor_transaction_id` VARCHAR(255) — charge ID from processor
- `processor_refund_id` VARCHAR(255) — refund ID if refunded
- `payment_method_id` UUID FK — which saved card was used
- `processor_fee` DECIMAL(10,2) — processing fee
- `net_amount` DECIMAL(10,2) — amount after fees

## Types

**Shared types (packages/shared/src/types.ts):**
- `PaymentMethodInfo` — { id, last4, brand, isDefault }
- `PaymentProcessor` — 'stripe' | 'stax'
- Existing `Transaction` gets new optional fields

**Payment service types (apps/web/src/services/payment/types.ts):**
- CreateCustomerInput/Result
- SavePaymentMethodInput/Result
- ChargeInput/Result
- RefundInput/Result
- WebhookEvent (normalized from processor-specific formats)

## Stripe Adapter

- Uses official `stripe` npm package
- PaymentIntents API (not legacy Charges)
- Signature verification via `stripe.webhooks.constructEvent()`
- Test mode keys only (`sk_test_*`)

## Factory

- Reads `PAYMENT_PROCESSOR` env var (defaults to `stripe`)
- Validates required env vars at instantiation (fail fast)
- Singleton pattern — one instance per process
- Throws on unknown processor value

## Environment Variables

```
PAYMENT_PROCESSOR=stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STAX_API_KEY=
STAX_MERCHANT_ID=
STAX_JS_PUBLIC_KEY=
STAX_WEBHOOK_SECRET=
```

## Out of Scope (Phase 2+)

- Frontend PaymentInput component
- Purchase route updates
- Webhook API endpoints
- Stax adapter implementation
- Saved payment methods UI
