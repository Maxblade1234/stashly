# Stashly Payment Checkout Flow — Phase 2 Design

> Wires Phase 1's PaymentService into a real checkout flow: Stripe Elements card input, updated purchase API, webhook handling, and payment method management.

**Approved:** 2026-03-16
**Scope:** Phase 2 (checkout flow with Stripe Elements)
**Depends on:** Phase 1 (PaymentService interface, StripeAdapter, DB schema)
**Reference:** `stashly_payment_spec.md (external)` Sections 6-9

---

## 1. Payment Flow Architecture

**Website-only card input for MVP.** The Chrome extension overlay continues to open stashly.com/gift-cards/buy for purchases. Stripe Elements runs on the website only — no card input in the extension content script.

**Flow:**
1. Extension detects checkout → shows savings overlay
2. User clicks "Save $X Now" → opens `stashly.com/gift-cards/buy?retailer=X&amount=Y`
3. Buy page calculates stack (existing)
4. **NEW: Payment step before purchase**
   - If saved card exists: show card pill + "Pay $X with Visa ····4242"
   - If no saved card: show Stripe Elements CardElement → tokenize → save method
5. Frontend sends `POST /api/purchase` with `payment_method_id`
6. Backend: validate → reserve cards → charge via PaymentService → deliver codes
7. Codes sent back to extension via `window.postMessage` (existing)

**New packages:**
- `@stripe/stripe-js` — Stripe.js loader
- `@stripe/react-stripe-js` — React CardElement + Elements provider

## 2. New API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/payment/config` | GET | Returns `{ publishableKey, processor }` for frontend init |
| `/api/payment-methods` | GET | List user's saved payment methods |
| `/api/payment-methods` | POST | Save a new tokenized card `{ token }` |
| `/api/payment-methods/[id]/route.ts` | DELETE | Remove a saved payment method |
| `/api/payment-methods/[id]/default/route.ts` | PUT | Set as default |
| `/api/webhooks/stripe/route.ts` | POST | Stripe webhook receiver |

All payment-methods endpoints require auth. Webhook endpoint uses signature verification instead.

## 3. Updated Purchase API (`/api/purchase`)

Current live mode returns `{ payment_required: true }`. Updated flow:

```
1. Validate auth, rate limit, retailer, cart total (existing)
2. Recalculate stack server-side (existing)
3. Reserve cards in inventory with 5-min TTL (existing)
4. Ensure user has processor customer ID (lazy-create if not)
5. Call PaymentService.chargeCustomer() with:
   - amount: Math.round(total_paid * 100) (dollars → cents)
   - currency: 'usd'
   - paymentMethodId from request body
   - idempotencyKey: transaction UUID
   - metadata: { transactionId, retailerId, userId }
6. On success: mark cards sold, decrypt codes, update transaction
7. On failure: release reservation, mark transaction failed
8. Return codes + savings to frontend
```

**Key decisions:**
- **Cents conversion**: All PaymentService amounts in cents (integer). Purchase route converts `total_paid * 100` with `Math.round()`.
- **Idempotency**: Transaction UUID = idempotency key. Safe to retry.
- **Lazy customer creation**: First purchase creates Stripe customer, saves `processor_customer_id` to profiles.
- **Always save card first**: Ensures user gets a saved method for future one-click purchases.

## 4. Frontend Components

### 4.1 StripeProvider (`components/StripeProvider.tsx`)
- Client component wrapping pages needing Stripe Elements
- Fetches `/api/payment/config` for publishable key
- Initializes `loadStripe()`, wraps children in `<Elements>`
- Loading state while Stripe.js loads

### 4.2 PaymentInput (`components/PaymentInput.tsx`)
- Props: `onTokenized(token, last4, brand)`, `onError(msg)`, `disabled`, `buttonText`
- Renders Stripe `<CardElement>` with Stashly brand styling
- Handles `stripe.createPaymentMethod()` on submit
- Inline validation errors
- Loading spinner during tokenization

### 4.3 SavedCardPill (`components/SavedCardPill.tsx`)
- Props: `last4`, `brand`, `isDefault`, `onSelect?`
- Renders: card brand icon + "····4242" + optional default badge
- Used on buy page and settings page

### 4.4 PaymentMethodManager (`components/PaymentMethodManager.tsx`)
- Full card CRUD for Settings page
- Lists saved cards via GET `/api/payment-methods`
- Add new card (shows PaymentInput inline)
- Set default, delete with confirmation modal

### 4.5 Updated BuyPage
New step between stack calculation and purchase:

```
Cart total input → Calculate stack →
  [Payment step: saved card or new card input] →
  Complete Purchase → Confirmation
```

- If saved cards exist: show default SavedCardPill + "Use different card" link
- If no cards: show PaymentInput
- "Complete Purchase" button sends `{ retailer_id, cart_total, payment_method_id }` to updated purchase API
- Demo mode bypass: skip payment step entirely (existing behavior)

## 5. Webhook Handling

**Endpoint:** `POST /api/webhooks/stripe`

**Implementation:**
- Get raw body via `request.text()` (before JSON parsing) for signature verification
- Call `PaymentService.handleWebhook(rawBody, signature)` to verify + normalize
- Exempt from auth middleware (authenticated by Stripe signature)
- Exempt from rate limiter (Stripe needs to send events freely)

**Events handled:**

| Stripe Event | Action |
|---|---|
| `payment_intent.succeeded` | Backup confirmation: if transaction still 'pending', mark completed + deliver codes |
| `payment_intent.payment_failed` | Release reservation, mark transaction 'failed' |
| `charge.refunded` | Update transaction status, adjust user Stashly balance |
| `charge.dispute.created` | Log warning, flag transaction for admin review |

**Idempotency:** Store webhook event ID. Skip if already processed. Prevents duplicate processing on Stripe retries.

**Processing:** Synchronous for MVP (handlers are fast DB updates). Returns 200 after processing. 500 on error triggers Stripe retry.

## 6. Database Migration (003)

New migration `003_webhook_events.sql`:

```sql
-- Webhook event deduplication
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id text PRIMARY KEY,              -- Stripe event ID (evt_...)
  type text NOT NULL,
  processor text NOT NULL,
  processed_at timestamptz DEFAULT now(),
  data jsonb
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at
  ON public.webhook_events(processed_at);
```

No other schema changes needed — migration 002 already added all payment columns to profiles, payment_methods, and transactions.

## 7. Middleware Updates

Exclude webhook endpoint from auth check and rate limiting:

```typescript
// Skip rate limiting for webhooks
if (pathname.startsWith('/api/webhooks/')) {
  return NextResponse.next();
}
```

## 8. Security Checklist

- [ ] Card data never touches server (Stripe Elements tokenizes client-side)
- [ ] Webhook signature verified before processing any event
- [ ] Payment method ownership verified (user can only use their own cards)
- [ ] Amount validated server-side (recalculate stack, don't trust client amount)
- [ ] Rate limit: 5 purchases per user per hour (existing, tighten from 3)
- [ ] Idempotency key on every charge (transaction UUID)
- [ ] Webhook events deduplicated by event ID
- [ ] publishableKey endpoint returns public key only (no secret keys)
- [ ] All payment errors wrapped in PaymentError (no Stripe internals leaked to client)
- [ ] Input validation with zod on all new endpoints

## 9. Out of Scope (Phase 3+)

- Stax adapter implementation
- Stax.js frontend integration
- Extension inline card input (one-click purchase with saved card)
- Background job queue for webhook processing
- 3D Secure / SCA challenge flow
- Email receipts / notifications
- Dispute management UI
