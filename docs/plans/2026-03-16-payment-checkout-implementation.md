# Payment Checkout Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire Phase 1's PaymentService into a real checkout flow — Stripe Elements card input on the buy page, payment method management, updated purchase API with charging, and webhook handling.

**Architecture:** Website-only card input via Stripe Elements. Extension opens buy page on stashly.com for purchases. PaymentService factory (Phase 1) is used by all backend routes. Lazy customer creation on first purchase. Webhook events deduplicated by event ID.

**Tech Stack:** Next.js 16 App Router, React 19, Stripe Elements (`@stripe/stripe-js`, `@stripe/react-stripe-js`), Supabase, PaymentService (Phase 1), zod validation, Tailwind CSS 4

**Design doc:** `docs/plans/2026-03-16-payment-checkout-design.md`

---

### Task 1: Install Stripe Frontend Packages

**Files:**
- Modify: `apps/web/package.json`

**Step 1: Install packages**

Run:
```bash
cd /Users/vicentexia/Downloads/GiftHauls/Stashly\ Extension/.worktrees/mvp
npm install @stripe/stripe-js @stripe/react-stripe-js -w apps/web
```

**Step 2: Verify installation**

Run: `cat apps/web/package.json | grep stripe`
Expected: Both `@stripe/stripe-js` and `@stripe/react-stripe-js` appear in dependencies.

**Step 3: Commit**

```bash
git add apps/web/package.json package-lock.json
git commit -m "chore: add Stripe Elements frontend packages"
```

---

### Task 2: Database Migration — Webhook Events Table

**Files:**
- Create: `apps/web/supabase/migrations/003_webhook_events.sql`

**Step 1: Write the migration**

```sql
-- 003_webhook_events.sql
-- Webhook event deduplication table

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id text PRIMARY KEY,                -- Stripe event ID (evt_...)
  type text NOT NULL,                 -- Event type (payment_intent.succeeded, etc.)
  processor text NOT NULL DEFAULT 'stripe',
  processed_at timestamptz NOT NULL DEFAULT now(),
  data jsonb
);

-- Index for cleanup queries (prune old events)
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at
  ON public.webhook_events(processed_at);

-- RLS: only service role can access webhook events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
```

**Step 2: Commit**

```bash
git add apps/web/supabase/migrations/003_webhook_events.sql
git commit -m "feat: add webhook_events table migration for deduplication"
```

---

### Task 3: Update Shared Types

**Files:**
- Modify: `packages/shared/src/types.ts`

Update `PurchaseRequest` to include `payment_method_id`:

```typescript
export interface PurchaseRequest {
  retailer_id: string;
  cart_total: number;
  payment_method_id?: string;  // Required in live mode, omitted in demo mode
}
```

Also add `PaymentConfig` response type:

```typescript
export interface PaymentConfig {
  publishableKey: string;
  processor: PaymentProcessor;
}
```

**Step 1: Make the changes**

In `packages/shared/src/types.ts`, update `PurchaseRequest` (lines 100-104) to add `payment_method_id` field. Add `PaymentConfig` interface after `PaymentMethodInfo`.

**Step 2: Verify build**

Run: `cd /Users/vicentexia/Downloads/GiftHauls/Stashly\ Extension/.worktrees/mvp && npx tsc --noEmit -p apps/web/tsconfig.json`

**Step 3: Commit**

```bash
git add packages/shared/src/types.ts
git commit -m "feat: add payment_method_id to PurchaseRequest, add PaymentConfig type"
```

---

### Task 4: Middleware — Exempt Webhooks

**Files:**
- Modify: `apps/web/src/middleware.ts`

**Step 1: Update middleware**

Add early return for webhook endpoints before rate limiting. In the `middleware` function, add this at the top of the function body (before the rate limit check):

```typescript
// Webhook endpoints are authenticated by signature verification, not by
// Supabase auth or rate limiting. Let them through unconditionally.
if (pathname.startsWith('/api/webhooks/')) {
  return NextResponse.next();
}
```

**Step 2: Verify no test breakage**

Run: `cd /Users/vicentexia/Downloads/GiftHauls/Stashly\ Extension/.worktrees/mvp && npm test -w apps/web`
Expected: All existing tests pass.

**Step 3: Commit**

```bash
git add apps/web/src/middleware.ts
git commit -m "feat: exempt webhook endpoints from rate limiting and auth"
```

---

### Task 5: API — Payment Config Endpoint

**Files:**
- Create: `apps/web/src/app/api/payment/config/route.ts`

**Step 1: Write the endpoint**

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  const processor = process.env.PAYMENT_PROCESSOR || 'stripe';

  let publishableKey = '';
  if (processor === 'stripe') {
    publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
  } else if (processor === 'stax') {
    publishableKey = process.env.STAX_JS_PUBLIC_KEY || '';
  }

  if (!publishableKey) {
    return NextResponse.json(
      { error: 'Payment configuration missing' },
      { status: 500 }
    );
  }

  return NextResponse.json({ publishableKey, processor });
}
```

**Step 2: Commit**

```bash
git add apps/web/src/app/api/payment/config/route.ts
git commit -m "feat: add GET /api/payment/config endpoint for frontend Stripe init"
```

---

### Task 6: API — Payment Methods CRUD

**Files:**
- Create: `apps/web/src/app/api/payment-methods/route.ts`
- Create: `apps/web/src/app/api/payment-methods/[id]/route.ts`
- Create: `apps/web/src/app/api/payment-methods/[id]/default/route.ts`

**Step 1: Write GET + POST `/api/payment-methods`**

```typescript
// apps/web/src/app/api/payment-methods/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPaymentService, PaymentError } from '@/services/payment';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('processor_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.processor_customer_id) {
    return NextResponse.json({ methods: [] });
  }

  try {
    const paymentService = createPaymentService();
    const methods = await paymentService.listPaymentMethods(profile.processor_customer_id);
    return NextResponse.json({ methods });
  } catch (err) {
    if (err instanceof PaymentError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { token } = await req.json();
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const paymentService = createPaymentService();
  const processor = process.env.PAYMENT_PROCESSOR || 'stripe';

  // Get or create customer
  let { data: profile } = await supabase
    .from('profiles')
    .select('processor_customer_id, payment_processor')
    .eq('id', user.id)
    .single();

  let customerId = profile?.processor_customer_id;

  if (!customerId) {
    try {
      const customer = await paymentService.createCustomer({
        email: user.email || '',
        metadata: { userId: user.id },
      });
      customerId = customer.customerId;

      await supabase.from('profiles').update({
        payment_processor: processor,
        processor_customer_id: customerId,
      }).eq('id', user.id);
    } catch (err) {
      if (err instanceof PaymentError) {
        return NextResponse.json({ error: 'Failed to create payment profile' }, { status: 502 });
      }
      throw err;
    }
  }

  // Save the payment method
  try {
    const result = await paymentService.savePaymentMethod({
      customerId,
      tokenizedCard: token,
    });

    // Store in our DB
    await supabase.from('payment_methods').insert({
      user_id: user.id,
      processor,
      processor_method_id: result.paymentMethodId,
      last4: result.last4,
      brand: result.brand,
      is_default: true, // First card is default
    });

    return NextResponse.json({
      id: result.paymentMethodId,
      last4: result.last4,
      brand: result.brand,
      isDefault: true,
    });
  } catch (err) {
    if (err instanceof PaymentError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
```

**Step 2: Write DELETE `/api/payment-methods/[id]`**

```typescript
// apps/web/src/app/api/payment-methods/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPaymentService, PaymentError } from '@/services/payment';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify ownership
  const { data: method } = await supabase
    .from('payment_methods')
    .select('processor_method_id')
    .eq('user_id', user.id)
    .eq('processor_method_id', id)
    .single();

  if (!method) {
    return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
  }

  try {
    const paymentService = createPaymentService();
    await paymentService.deletePaymentMethod(id);

    await supabase.from('payment_methods')
      .delete()
      .eq('processor_method_id', id)
      .eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof PaymentError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    throw err;
  }
}
```

**Step 3: Write PUT `/api/payment-methods/[id]/default`**

```typescript
// apps/web/src/app/api/payment-methods/[id]/default/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify ownership
  const { data: method } = await supabase
    .from('payment_methods')
    .select('id')
    .eq('user_id', user.id)
    .eq('processor_method_id', id)
    .single();

  if (!method) {
    return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
  }

  // Unset all defaults for this user, then set the new one
  await supabase.from('payment_methods')
    .update({ is_default: false })
    .eq('user_id', user.id);

  await supabase.from('payment_methods')
    .update({ is_default: true })
    .eq('processor_method_id', id)
    .eq('user_id', user.id);

  return NextResponse.json({ success: true });
}
```

**Step 4: Verify build**

Run: `cd /Users/vicentexia/Downloads/GiftHauls/Stashly\ Extension/.worktrees/mvp && npx tsc --noEmit -p apps/web/tsconfig.json`

**Step 5: Commit**

```bash
git add apps/web/src/app/api/payment-methods/
git commit -m "feat: add payment methods CRUD API (list, save, delete, set default)"
```

---

### Task 7: API — Stripe Webhook Handler

**Files:**
- Create: `apps/web/src/app/api/webhooks/stripe/route.ts`

**Step 1: Write the webhook handler**

```typescript
// apps/web/src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createPaymentService, PaymentError } from '@/services/payment';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Use service role for webhook processing (no user context)
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // Verify signature and parse event
  let event;
  try {
    const paymentService = createPaymentService();
    event = await paymentService.handleWebhook(rawBody, signature);
  } catch (err) {
    if (err instanceof PaymentError) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
    throw err;
  }

  const supabase = getAdminClient();

  // Idempotency: skip if already processed
  const { data: existing } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('id', event.id)
    .single();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Record the event before processing
  await supabase.from('webhook_events').insert({
    id: event.id,
    type: event.type,
    processor: 'stripe',
    data: event.data,
  });

  // Route to handler
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(supabase, event.data);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(supabase, event.data);
        break;
      case 'charge.refunded':
        await handleRefund(supabase, event.data);
        break;
      case 'charge.dispute.created':
        await handleDispute(supabase, event.data);
        break;
      default:
        // Unhandled event type — log and acknowledge
        console.log(`Unhandled webhook event: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error processing webhook ${event.type}:`, err);
    // Return 500 so Stripe retries
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSucceeded(
  supabase: ReturnType<typeof createAdminClient>,
  data: Record<string, unknown>
) {
  const processorTxnId = data.id as string;
  const metadata = (data.metadata || {}) as Record<string, string>;
  const transactionId = metadata.transactionId;

  if (!transactionId) return;

  // Only update if still pending (primary flow already completed it)
  const { data: txn } = await supabase
    .from('transactions')
    .select('status')
    .eq('id', transactionId)
    .single();

  if (txn?.status === 'pending') {
    await supabase.from('transactions').update({
      status: 'completed',
      processor_transaction_id: processorTxnId,
    }).eq('id', transactionId);
  }
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof createAdminClient>,
  data: Record<string, unknown>
) {
  const metadata = (data.metadata || {}) as Record<string, string>;
  const transactionId = metadata.transactionId;

  if (!transactionId) return;

  await supabase.from('transactions').update({
    status: 'failed',
  }).eq('id', transactionId);

  // Release inventory reservation
  try {
    const INVENTORY_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3001';
    await fetch(`${INVENTORY_URL}/cards/unreserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-key': process.env.INVENTORY_SERVICE_API_KEY || '',
      },
      body: JSON.stringify({ transaction_id: transactionId }),
    });
  } catch (err) {
    console.error('Failed to release reservation for', transactionId, err);
  }
}

async function handleRefund(
  supabase: ReturnType<typeof createAdminClient>,
  data: Record<string, unknown>
) {
  const paymentIntentId = data.payment_intent as string;
  if (!paymentIntentId) return;

  // Find our transaction by processor_transaction_id
  const { data: txn } = await supabase
    .from('transactions')
    .select('id, user_id, retailer_id, savings')
    .eq('processor_transaction_id', paymentIntentId)
    .single();

  if (!txn) return;

  await supabase.from('transactions').update({
    status: 'refunded',
  }).eq('id', txn.id);

  // Reverse the savings from user balance if applicable
  const { data: balance } = await supabase
    .from('stashly_balances')
    .select('id, balance')
    .eq('user_id', txn.user_id)
    .eq('retailer_id', txn.retailer_id)
    .single();

  if (balance && balance.balance > 0) {
    const newBalance = Math.max(0, balance.balance - (txn.savings || 0));
    await supabase.from('stashly_balances')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', balance.id);
  }
}

async function handleDispute(
  supabase: ReturnType<typeof createAdminClient>,
  data: Record<string, unknown>
) {
  const paymentIntentId = data.payment_intent as string;
  console.warn(`DISPUTE received for payment_intent: ${paymentIntentId}`, data);

  if (paymentIntentId) {
    // Flag the transaction for admin review
    const { data: txn } = await supabase
      .from('transactions')
      .select('id')
      .eq('processor_transaction_id', paymentIntentId)
      .single();

    if (txn) {
      // For now, log it. Admin can see disputed status in Stripe dashboard.
      console.warn(`Transaction ${txn.id} has a dispute. Review in Stripe dashboard.`);
    }
  }
}
```

**Step 2: Verify build**

Run: `cd /Users/vicentexia/Downloads/GiftHauls/Stashly\ Extension/.worktrees/mvp && npx tsc --noEmit -p apps/web/tsconfig.json`

**Step 3: Commit**

```bash
git add apps/web/src/app/api/webhooks/stripe/route.ts
git commit -m "feat: add Stripe webhook handler with idempotency and event routing"
```

---

### Task 8: Update Purchase API Route — Live Payment

**Files:**
- Modify: `apps/web/src/app/api/purchase/route.ts`

**Step 1: Update the purchase route**

Replace the entire live-mode section (after the demo mode block). The updated route:
- Accepts `payment_method_id` in the request body
- Validates ownership of the payment method
- Gets or creates a processor customer
- Calls `PaymentService.chargeCustomer()` with cents conversion
- On success: marks transaction completed, returns codes
- On failure: releases reservation, returns error

Key changes to the existing file:

1. Add import for `createPaymentService` and `PaymentError` and `releaseCards`/`unreserveCards`
2. Add `payment_method_id` to the destructured request body
3. Replace the `// Live mode: return transaction ID for payment page` section with the full charge flow

The updated request body parsing:
```typescript
const { retailer_id, cart_total, payment_method_id } = await req.json();
```

After the demo mode block (replacing lines 139-145), add:

```typescript
// Live mode: charge the user
if (!payment_method_id || typeof payment_method_id !== 'string') {
  // Release reservation since we can't charge
  await unreserveCards(transactionId);
  return NextResponse.json({ error: 'Payment method required' }, { status: 400 });
}

// Verify payment method ownership
const { data: method } = await supabase
  .from('payment_methods')
  .select('processor_method_id')
  .eq('user_id', user.id)
  .eq('processor_method_id', payment_method_id)
  .single();

if (!method) {
  await unreserveCards(transactionId);
  return NextResponse.json({ error: 'Invalid payment method' }, { status: 403 });
}

// Get or create customer
let { data: profile } = await supabase
  .from('profiles')
  .select('processor_customer_id')
  .eq('id', user.id)
  .single();

if (!profile?.processor_customer_id) {
  const paymentService = createPaymentService();
  try {
    const customer = await paymentService.createCustomer({
      email: user.email || '',
      metadata: { userId: user.id },
    });
    await supabase.from('profiles').update({
      payment_processor: process.env.PAYMENT_PROCESSOR || 'stripe',
      processor_customer_id: customer.customerId,
    }).eq('id', user.id);
    profile = { processor_customer_id: customer.customerId };
  } catch (err) {
    await unreserveCards(transactionId);
    return NextResponse.json({ error: 'Failed to create payment profile' }, { status: 502 });
  }
}

// Charge
const amountCents = Math.round(stack.total_paid * 100);
try {
  const paymentService = createPaymentService();
  const charge = await paymentService.chargeCustomer({
    customerId: profile.processor_customer_id!,
    paymentMethodId: payment_method_id,
    amount: amountCents,
    currency: 'usd',
    idempotencyKey: transactionId,
    metadata: {
      transactionId,
      retailerId: retailer_id,
      userId: user.id,
    },
  });

  if (charge.status !== 'succeeded') {
    await unreserveCards(transactionId);
    await supabase.from('transactions').update({ status: 'failed' }).eq('id', transactionId);
    return NextResponse.json({ error: 'Payment not completed. Please try again.' }, { status: 402 });
  }

  // Payment succeeded — release cards as sold
  const soldCards = await releaseCards(transactionId);

  // Build delivered codes
  const codes = (soldCards.cards || []).map((c: any) => ({
    denomination: c.denomination,
    code: c.code,
    pin: c.pin || null,
  }));

  // Update transaction
  await supabase.from('transactions').update({
    status: 'completed',
    processor: process.env.PAYMENT_PROCESSOR || 'stripe',
    processor_transaction_id: charge.processorRef,
    payment_method_id: payment_method_id,
    cards_purchased: codes.map((c: any) => ({
      denomination: c.denomination,
      cost: stack.cards.find(sc => sc.denomination === c.denomination)?.price_per_card || 0,
      code_last4: c.code.slice(-4),
    })),
  }).eq('id', transactionId);

  // Update Stashly balance
  if (stack.residual_balance > 0) {
    const { data: existing } = await supabase
      .from('stashly_balances')
      .select('id, balance')
      .eq('user_id', user.id)
      .eq('retailer_id', retailer_id)
      .single();

    if (existing) {
      await supabase.from('stashly_balances')
        .update({ balance: existing.balance + stack.residual_balance, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase.from('stashly_balances').insert({
        user_id: user.id,
        retailer_id: retailer_id,
        balance: stack.residual_balance,
      });
    }
  }

  // Update user savings total
  await supabase.rpc('increment_savings', { user_id: user.id, amount: stack.savings });

  return NextResponse.json({
    transaction_id: transactionId,
    codes,
    residual_balance: stack.residual_balance,
    total_paid: stack.total_paid,
    total_savings: stack.savings,
  });

} catch (err) {
  console.error('Payment failed:', err);
  await unreserveCards(transactionId);
  await supabase.from('transactions').update({ status: 'failed' }).eq('id', transactionId);

  if (err instanceof PaymentError) {
    return NextResponse.json(
      { error: err.isRetryable ? 'Payment failed. Please try again.' : 'Payment declined.' },
      { status: 402 }
    );
  }
  return NextResponse.json({ error: 'Payment processing error' }, { status: 500 });
}
```

**Step 2: Verify build**

Run: `cd /Users/vicentexia/Downloads/GiftHauls/Stashly\ Extension/.worktrees/mvp && npx tsc --noEmit -p apps/web/tsconfig.json`

**Step 3: Commit**

```bash
git add apps/web/src/app/api/purchase/route.ts
git commit -m "feat: wire purchase API to PaymentService for live payments"
```

---

### Task 9: StripeProvider Component

**Files:**
- Create: `apps/web/src/components/StripeProvider.tsx`

**Step 1: Write the component**

```tsx
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';

let stripePromise: Promise<Stripe | null> | null = null;

function getStripePromise(publishableKey: string) {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

interface StripeProviderProps {
  children: ReactNode;
}

export default function StripeProvider({ children }: StripeProviderProps) {
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/payment/config')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load payment config');
        return res.json();
      })
      .then(data => setPublishableKey(data.publishableKey))
      .catch(err => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-red-500">Payment system unavailable. Please try again later.</p>
      </div>
    );
  }

  if (!publishableKey) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <Elements stripe={getStripePromise(publishableKey)} options={{ locale: 'en' }}>
      {children}
    </Elements>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/vicentexia/Downloads/GiftHauls/Stashly\ Extension/.worktrees/mvp && npx tsc --noEmit -p apps/web/tsconfig.json`

**Step 3: Commit**

```bash
git add apps/web/src/components/StripeProvider.tsx
git commit -m "feat: add StripeProvider component for Stripe Elements initialization"
```

---

### Task 10: PaymentInput Component

**Files:**
- Create: `apps/web/src/components/PaymentInput.tsx`

**Step 1: Write the component**

```tsx
'use client';

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, CreditCard } from 'lucide-react';

interface PaymentInputProps {
  onTokenized: (token: string, last4: string, brand: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
  buttonText?: string;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      color: '#111827',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: {
      color: '#dc2626',
      iconColor: '#dc2626',
    },
  },
};

export default function PaymentInput({
  onTokenized,
  onError,
  disabled = false,
  buttonText = 'Save Card',
}: PaymentInputProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState('');
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError('Payment system not ready. Please wait.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card input not found.');
      return;
    }

    setProcessing(true);
    setCardError('');

    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        setCardError(error.message || 'Card validation failed');
        onError(error.message || 'Card validation failed');
        return;
      }

      if (paymentMethod) {
        onTokenized(
          paymentMethod.id,
          paymentMethod.card?.last4 || '0000',
          paymentMethod.card?.brand || 'unknown'
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed';
      setCardError(msg);
      onError(msg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div
        className="px-4 py-3 rounded-xl border border-gray-200 bg-white transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500"
      >
        <CardElement
          options={CARD_ELEMENT_OPTIONS}
          onChange={(e) => {
            setCardComplete(e.complete);
            if (e.error) {
              setCardError(e.error.message);
            } else {
              setCardError('');
            }
          }}
        />
      </div>

      {cardError && (
        <p className="text-xs text-red-600">{cardError}</p>
      )}

      <button
        type="submit"
        disabled={disabled || processing || !cardComplete || !stripe}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-semibold text-sm transition-all hover:shadow-lg disabled:opacity-50"
        style={{ backgroundColor: '#2B3FE0' }}
      >
        {processing ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            <CreditCard size={16} />
            {buttonText}
          </>
        )}
      </button>
    </form>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/vicentexia/Downloads/GiftHauls/Stashly\ Extension/.worktrees/mvp && npx tsc --noEmit -p apps/web/tsconfig.json`

**Step 3: Commit**

```bash
git add apps/web/src/components/PaymentInput.tsx
git commit -m "feat: add PaymentInput component with Stripe Elements CardElement"
```

---

### Task 11: SavedCardPill Component

**Files:**
- Create: `apps/web/src/components/SavedCardPill.tsx`

**Step 1: Write the component**

```tsx
'use client';

interface SavedCardPillProps {
  last4: string;
  brand: string;
  isDefault?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
}

const brandLabels: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  discover: 'Discover',
  unknown: 'Card',
};

export default function SavedCardPill({
  last4,
  brand,
  isDefault = false,
  selected = false,
  onSelect,
  onRemove,
}: SavedCardPillProps) {
  const brandLabel = brandLabels[brand.toLowerCase()] || brand;

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
          : 'border-gray-200 bg-white hover:border-gray-300'
      } ${onSelect ? 'cursor-pointer' : ''}`}
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={onSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); } : undefined}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-900">
          {brandLabel}
        </span>
        <span className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-mono)' }}>
          ····{last4}
        </span>
        {isDefault && (
          <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
            Default
          </span>
        )}
      </div>

      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          Remove
        </button>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/SavedCardPill.tsx
git commit -m "feat: add SavedCardPill component for displaying saved payment methods"
```

---

### Task 12: PaymentMethodManager Component

**Files:**
- Create: `apps/web/src/components/PaymentMethodManager.tsx`

**Step 1: Write the component**

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, CreditCard } from 'lucide-react';
import SavedCardPill from './SavedCardPill';
import StripeProvider from './StripeProvider';
import PaymentInput from './PaymentInput';

interface PaymentMethod {
  id: string;
  last4: string;
  brand: string;
  isDefault: boolean;
}

export default function PaymentMethodManager() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchMethods = useCallback(async () => {
    try {
      const res = await fetch('/api/payment-methods');
      if (!res.ok) throw new Error('Failed to load payment methods');
      const data = await res.json();
      setMethods(data.methods || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMethods(); }, [fetchMethods]);

  const handleTokenized = async (token: string) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save card');
      }
      setShowAddCard(false);
      await fetchMethods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save card');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this payment method?')) return;
    try {
      const res = await fetch(`/api/payment-methods/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove');
      await fetchMethods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/payment-methods/${id}/default`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to set default');
      await fetchMethods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
          Payment Methods
        </h2>
        {!showAddCard && (
          <button
            onClick={() => setShowAddCard(true)}
            className="text-xs font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
            style={{ color: '#2B3FE0' }}
          >
            <Plus size={14} />
            Add Card
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>
      )}

      {methods.length === 0 && !showAddCard && (
        <div className="text-center py-6">
          <CreditCard size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No payment methods saved</p>
          <button
            onClick={() => setShowAddCard(true)}
            className="mt-2 text-sm font-medium hover:opacity-80"
            style={{ color: '#2B3FE0' }}
          >
            Add your first card
          </button>
        </div>
      )}

      {methods.length > 0 && (
        <div className="space-y-2 mb-3">
          {methods.map(m => (
            <SavedCardPill
              key={m.id}
              last4={m.last4}
              brand={m.brand}
              isDefault={m.isDefault}
              onSelect={() => !m.isDefault && handleSetDefault(m.id)}
              onRemove={() => handleRemove(m.id)}
            />
          ))}
        </div>
      )}

      {showAddCard && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <StripeProvider>
            <PaymentInput
              onTokenized={handleTokenized}
              onError={(msg) => setError(msg)}
              disabled={saving}
              buttonText={saving ? 'Saving...' : 'Save Card'}
            />
          </StripeProvider>
          <button
            onClick={() => setShowAddCard(false)}
            className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/vicentexia/Downloads/GiftHauls/Stashly\ Extension/.worktrees/mvp && npx tsc --noEmit -p apps/web/tsconfig.json`

**Step 3: Commit**

```bash
git add apps/web/src/components/PaymentMethodManager.tsx
git commit -m "feat: add PaymentMethodManager component with full card CRUD"
```

---

### Task 13: Update Buy Page — Payment Step

**Files:**
- Modify: `apps/web/src/app/gift-cards/buy/page.tsx`

**Step 1: Update the buy page**

The buy page needs a new state machine step between stack calculation and purchase. After the stack is calculated, show:
- Saved card selection (if user has cards)
- New card input via PaymentInput (if no cards or user clicks "use different card")
- "Complete Purchase" button that sends `payment_method_id` to the updated API

Add these new states to `BuyPageContent`:
```typescript
const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
const [showNewCard, setShowNewCard] = useState(false);
const [loadingMethods, setLoadingMethods] = useState(false);
```

After stack calculation succeeds, fetch payment methods:
```typescript
// In fetchStack success handler, after setStack(data.stack):
if (!isDemoMode) {
  setLoadingMethods(true);
  fetch('/api/payment-methods')
    .then(r => r.json())
    .then(d => {
      setPaymentMethods(d.methods || []);
      const defaultMethod = (d.methods || []).find((m: any) => m.isDefault);
      if (defaultMethod) setSelectedMethodId(defaultMethod.id);
    })
    .finally(() => setLoadingMethods(false));
}
```

Check demo mode:
```typescript
const isDemoMode = process.env.NEXT_PUBLIC_STASHLY_MODE === 'demo';
```

Update `handlePurchase` to include payment_method_id:
```typescript
body: JSON.stringify({
  retailer_id: retailerId,
  cart_total: stack.cart_total,
  payment_method_id: selectedMethodId,
}),
```

Between the StackBreakdown and the purchase button, add the payment section:
```tsx
{/* Payment method selection — only in live mode */}
{!isDemoMode && (
  <div className="mt-4 mb-2">
    {loadingMethods ? (
      <div className="flex justify-center py-4">
        <Loader2 size={16} className="animate-spin text-gray-400" />
      </div>
    ) : paymentMethods.length > 0 && !showNewCard ? (
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500 mb-2">Pay with</p>
        {paymentMethods.map(m => (
          <SavedCardPill
            key={m.id}
            last4={m.last4}
            brand={m.brand}
            isDefault={m.isDefault}
            selected={selectedMethodId === m.id}
            onSelect={() => setSelectedMethodId(m.id)}
          />
        ))}
        <button
          onClick={() => setShowNewCard(true)}
          className="text-xs font-medium hover:opacity-80"
          style={{ color: '#2B3FE0' }}
        >
          + Use a different card
        </button>
      </div>
    ) : (
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">
          {paymentMethods.length > 0 ? 'Add a new card' : 'Add a payment method'}
        </p>
        <StripeProvider>
          <PaymentInput
            onTokenized={async (token) => {
              // Save the card, then select it
              const res = await fetch('/api/payment-methods', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
              });
              if (res.ok) {
                const data = await res.json();
                setPaymentMethods(prev => [...prev, data]);
                setSelectedMethodId(data.id);
                setShowNewCard(false);
              }
            }}
            onError={(msg) => setError(msg)}
            buttonText="Save Card"
          />
        </StripeProvider>
        {paymentMethods.length > 0 && (
          <button
            onClick={() => setShowNewCard(false)}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600"
          >
            Use saved card instead
          </button>
        )}
      </div>
    )}
  </div>
)}
```

Disable purchase button if no payment method selected (live mode):
```tsx
disabled={purchasing || (!isDemoMode && !selectedMethodId)}
```

Add imports at the top:
```typescript
import SavedCardPill from '@/components/SavedCardPill';
import StripeProvider from '@/components/StripeProvider';
import PaymentInput from '@/components/PaymentInput';
```

**Step 2: Add `NEXT_PUBLIC_STASHLY_MODE` to `.env.example`**

Add `NEXT_PUBLIC_STASHLY_MODE=demo` to the env example file so the frontend can check demo mode.

**Step 3: Verify build**

Run: `cd /Users/vicentexia/Downloads/GiftHauls/Stashly\ Extension/.worktrees/mvp && npx tsc --noEmit -p apps/web/tsconfig.json`

**Step 4: Commit**

```bash
git add apps/web/src/app/gift-cards/buy/page.tsx .env.example
git commit -m "feat: add payment method selection to buy page for live purchases"
```

---

### Task 14: Update Settings Page — Payment Methods Section

**Files:**
- Modify: `apps/web/src/app/settings/page.tsx`

**Step 1: Add PaymentMethodManager to settings**

Import and add the component between the Account info section and the Sign Out button:

```tsx
import PaymentMethodManager from '@/components/PaymentMethodManager';
```

Insert between the Account card and the Sign Out button (after the closing `</div>` of the account info card, before the sign out button):

```tsx
{/* Payment methods */}
<PaymentMethodManager />

{/* Spacer */}
<div className="mb-6" />
```

Wait — the `<PaymentMethodManager>` already has the `mb-6` margin wrapper, but we need a spacer. Actually, looking at the existing code, each section has `mb-6`. Just add it between:

After line 89 (`</div>` closing the Account card with `mb-6`), add:
```tsx
{/* Payment methods */}
<div className="mb-6">
  <PaymentMethodManager />
</div>
```

**Step 2: Verify build**

Run: `cd /Users/vicentexia/Downloads/GiftHauls/Stashly\ Extension/.worktrees/mvp && npx tsc --noEmit -p apps/web/tsconfig.json`

**Step 3: Commit**

```bash
git add apps/web/src/app/settings/page.tsx
git commit -m "feat: add payment method management to settings page"
```

---

### Task 15: Unit Tests — Payment Methods API

**Files:**
- Create: `apps/web/src/app/api/payment-methods/__tests__/route.test.ts`

**Step 1: Write tests**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Mock PaymentService
const mockPaymentService = {
  listPaymentMethods: vi.fn(),
  createCustomer: vi.fn(),
  savePaymentMethod: vi.fn(),
  deletePaymentMethod: vi.fn(),
};

vi.mock('@/services/payment', () => ({
  createPaymentService: vi.fn(() => mockPaymentService),
  PaymentError: class PaymentError extends Error {
    code: string;
    constructor(msg: string, code: string) { super(msg); this.code = code; this.name = 'PaymentError'; }
  },
}));

describe('GET /api/payment-methods', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 401 for unauthenticated requests', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('../route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns empty methods if user has no customer ID', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    });

    const { GET } = await import('../route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.methods).toEqual([]);
  });
});

describe('POST /api/payment-methods', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 400 if token is missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.com' } } });

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/payment-methods', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Missing token');
  });
});
```

**Step 2: Run tests**

Run: `cd /Users/vicentexia/Downloads/GiftHauls/Stashly\ Extension/.worktrees/mvp && npm test -w apps/web -- --run`
Expected: New tests pass alongside existing tests.

**Step 3: Commit**

```bash
git add apps/web/src/app/api/payment-methods/__tests__/
git commit -m "test: add unit tests for payment methods API"
```

---

### Task 16: Unit Tests — Webhook Handler

**Files:**
- Create: `apps/web/src/app/api/webhooks/stripe/__tests__/route.test.ts`

**Step 1: Write tests**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock PaymentService
const mockPaymentService = {
  handleWebhook: vi.fn(),
};

vi.mock('@/services/payment', () => ({
  createPaymentService: vi.fn(() => mockPaymentService),
  PaymentError: class PaymentError extends Error {
    code: string;
    constructor(msg: string, code: string) { super(msg); this.code = code; this.name = 'PaymentError'; }
  },
}));

// Mock Supabase admin client
const mockAdminClient = {
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null }),
      }),
    }),
    insert: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({}),
    }),
  }),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockAdminClient),
}));

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 400 if signature header is missing', async () => {
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: '{}',
    });
    // No stripe-signature header
    const response = await POST(req as any);
    expect(response.status).toBe(400);
  });

  it('returns 400 if signature is invalid', async () => {
    const { PaymentError } = await import('@/services/payment');
    mockPaymentService.handleWebhook.mockRejectedValue(
      new PaymentError('Invalid signature', 'webhook_error')
    );

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: '{"test": true}',
      headers: { 'stripe-signature': 'bad_sig' },
    });
    const response = await POST(req as any);
    expect(response.status).toBe(400);
  });

  it('returns 200 and processes valid event', async () => {
    mockPaymentService.handleWebhook.mockResolvedValue({
      id: 'evt_123',
      type: 'payment_intent.succeeded',
      data: { id: 'pi_123', metadata: { transactionId: 'txn_abc' } },
    });

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: '{"test": true}',
      headers: { 'stripe-signature': 'valid_sig' },
    });
    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);
  });
});
```

**Step 2: Run tests**

Run: `cd /Users/vicentexia/Downloads/GiftHauls/Stashly\ Extension/.worktrees/mvp && npm test -w apps/web -- --run`

**Step 3: Commit**

```bash
git add apps/web/src/app/api/webhooks/stripe/__tests__/
git commit -m "test: add unit tests for Stripe webhook handler"
```

---

### Task 17: Final Build Verification & Push

**Step 1: Full build check**

Run:
```bash
cd /Users/vicentexia/Downloads/GiftHauls/Stashly\ Extension/.worktrees/mvp
npx tsc --noEmit -p apps/web/tsconfig.json
npm test -w apps/web -- --run
```
Expected: Zero type errors, all tests pass.

**Step 2: Run full test suite**

Run: `npm test -- --run`
Expected: All tests pass (stacking + factory + constructor + payment-methods + webhook).

**Step 3: Push**

Run: `git push origin feature/mvp-implementation`

**Step 4: Commit summary**

Verify with: `git log --oneline -15`
Expected commits from this phase:
- chore: add Stripe Elements frontend packages
- feat: add webhook_events table migration for deduplication
- feat: add payment_method_id to PurchaseRequest, add PaymentConfig type
- feat: exempt webhook endpoints from rate limiting and auth
- feat: add GET /api/payment/config endpoint
- feat: add payment methods CRUD API
- feat: add Stripe webhook handler with idempotency
- feat: wire purchase API to PaymentService for live payments
- feat: add StripeProvider component
- feat: add PaymentInput component with Stripe Elements
- feat: add SavedCardPill component
- feat: add PaymentMethodManager component with full card CRUD
- feat: add payment method selection to buy page
- feat: add payment method management to settings page
- test: add unit tests for payment methods API
- test: add unit tests for Stripe webhook handler
