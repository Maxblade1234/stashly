import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Create sample transactions for demo
    const { data: retailers } = await supabase
      .from('retailers')
      .select('id, name')
      .in('name', ['Apple', 'Chipotle', 'Dominos', 'eBay', 'Fanatics']);

    if (!retailers || retailers.length === 0) {
      return NextResponse.json({ error: 'No retailers found. Run migration first.' }, { status: 400 });
    }

    const sampleTransactions = [
      {
        user_id: user.id,
        retailer_id: retailers.find(r => r.name === 'Apple')?.id,
        cards_purchased: [{ denomination: 50, cost: 47, code_last4: 'A1B2' }],
        total_paid: 47,
        total_value: 50,
        savings: 3,
        residual_balance: 4.50,
        status: 'completed',
        demo: true,
      },
      {
        user_id: user.id,
        retailer_id: retailers.find(r => r.name === 'Chipotle')?.id,
        cards_purchased: [
          { denomination: 25, cost: 22.50, code_last4: 'C3D4' },
          { denomination: 10, cost: 9.20, code_last4: 'E5F6' },
        ],
        total_paid: 31.70,
        total_value: 35,
        savings: 3.30,
        residual_balance: 2.25,
        status: 'completed',
        demo: true,
      },
      {
        user_id: user.id,
        retailer_id: retailers.find(r => r.name === 'eBay')?.id,
        cards_purchased: [{ denomination: 100, cost: 95, code_last4: 'G7H8' }],
        total_paid: 95,
        total_value: 100,
        savings: 5,
        residual_balance: 0,
        status: 'completed',
        demo: true,
      },
    ].filter(t => t.retailer_id);

    // Insert transactions
    const { error: txError } = await supabase
      .from('transactions')
      .insert(sampleTransactions);

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    // Create Stashly balances
    const balances = [
      {
        user_id: user.id,
        retailer_id: retailers.find(r => r.name === 'Apple')?.id,
        balance: 4.50,
      },
      {
        user_id: user.id,
        retailer_id: retailers.find(r => r.name === 'Chipotle')?.id,
        balance: 2.25,
      },
    ].filter(b => b.retailer_id);

    const { error: balError } = await supabase
      .from('stashly_balances')
      .upsert(balances, { onConflict: 'user_id,retailer_id' });

    if (balError) {
      return NextResponse.json({ error: balError.message }, { status: 500 });
    }

    // Update profile savings total
    const totalSavings = sampleTransactions.reduce((sum, t) => sum + t.savings, 0);
    await supabase
      .from('profiles')
      .update({ savings_total: totalSavings, role: 'admin' })
      .eq('id', user.id);

    return NextResponse.json({
      message: 'Demo data seeded successfully',
      transactions: sampleTransactions.length,
      balances: balances.length,
      totalSavings,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to seed demo data' }, { status: 500 });
  }
}
