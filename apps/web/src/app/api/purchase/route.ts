import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAvailability, reserveCards, releaseCards, unreserveCards } from '@/lib/inventory-client';
import { createPaymentService, PaymentError } from '@/services/payment';
import { calculateOptimalStack } from '@/lib/stacking';
import { rateLimit } from '@/lib/rate-limit';
import { randomUUID } from 'node:crypto';

const MAX_PURCHASES_PER_HOUR = 3;
const isDemoMode = process.env.STASHLY_MODE === 'demo';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!rateLimit(`purchase:${user.id}`, MAX_PURCHASES_PER_HOUR, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const { retailer_id, cart_total, payment_method_id } = await req.json();
  if (!retailer_id || !cart_total || cart_total <= 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { data: retailer } = await supabase
    .from('retailers')
    .select('*')
    .eq('id', retailer_id)
    .eq('is_active', true)
    .single();

  if (!retailer) {
    return NextResponse.json({ error: 'Retailer not found' }, { status: 404 });
  }

  // Recalculate stack server-side
  const today = new Date().toISOString().split('T')[0];
  const { data: todayTxns } = await supabase
    .from('transactions')
    .select('total_paid')
    .eq('user_id', user.id)
    .eq('retailer_id', retailer_id)
    .eq('status', 'completed')
    .gte('created_at', `${today}T00:00:00Z`);

  const spentToday = (todayTxns || []).reduce((sum: number, t: any) => sum + t.total_paid, 0);
  const availability = await getAvailability(retailer.name);
  const stack = calculateOptimalStack(cart_total, availability, {
    maxCards: retailer.max_gift_cards_per_order,
    dailyLimitUsd: retailer.per_user_daily_limit_usd,
    spentTodayUsd: spentToday,
  });

  if (stack.cards.length === 0) {
    return NextResponse.json({ error: 'No gift cards available' }, { status: 409 });
  }

  const transactionId = randomUUID();

  const cardsToReserve = stack.cards.map(c => ({
    denomination: c.denomination,
    quantity: c.quantity,
  }));

  const reservation = await reserveCards(retailer.name, cardsToReserve, transactionId);
  if (!reservation.success) {
    return NextResponse.json({ error: 'Cards no longer available' }, { status: 409 });
  }

  await supabase.from('transactions').insert({
    id: transactionId,
    user_id: user.id,
    retailer_id,
    cards_purchased: [],
    total_paid: stack.total_paid,
    total_value: stack.total_gift_card_value,
    savings: stack.savings,
    residual_balance: stack.residual_balance,
    status: 'pending',
    demo: isDemoMode,
  });

  if (isDemoMode) {
    const demoCodes = stack.cards.flatMap(card =>
      Array.from({ length: card.quantity }, () => {
        const seg = () => randomUUID().slice(0, 4).toUpperCase();
        return {
          denomination: card.denomination,
          code: `DEMO-${seg()}-${seg()}-${seg()}`,
          pin: null,
          code_last4: seg(),
        };
      })
    );

    await supabase.from('transactions').update({
      status: 'completed',
      cards_purchased: demoCodes.map(c => ({
        denomination: c.denomination,
        cost: stack.cards.find(sc => sc.denomination === c.denomination)!.price_per_card,
        code_last4: c.code_last4,
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

    return NextResponse.json({
      transaction_id: transactionId,
      codes: demoCodes,
      residual_balance: stack.residual_balance,
      total_paid: stack.total_paid,
      total_savings: stack.savings,
    });
  }

  // Live mode: charge the user
  if (!payment_method_id || typeof payment_method_id !== 'string') {
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

  // Get or create processor customer
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
    } catch {
      await unreserveCards(transactionId);
      return NextResponse.json({ error: 'Failed to create payment profile' }, { status: 502 });
    }
  }

  // Charge the customer
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

    // Payment succeeded — mark cards as sold and get codes
    const soldCards = await releaseCards(transactionId);
    const codes = (soldCards.cards || []).map((c: any) => ({
      denomination: c.denomination,
      code: c.code,
      pin: c.pin || null,
    }));

    // Update transaction record
    await supabase.from('transactions').update({
      status: 'completed',
      processor: process.env.PAYMENT_PROCESSOR || 'stripe',
      processor_transaction_id: charge.processorRef,
      payment_method_id: payment_method_id,
      cards_purchased: codes.map((c: any) => ({
        denomination: c.denomination,
        cost: stack.cards.find((sc: any) => sc.denomination === c.denomination)?.price_per_card || 0,
        code_last4: c.code.slice(-4),
      })),
    }).eq('id', transactionId);

    // Update Stashly balance for residual
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
}
