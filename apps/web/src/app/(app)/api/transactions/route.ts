import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const retailerFilter = searchParams.get('retailer');
  const offset = (page - 1) * limit;

  let query = supabase
    .from('transactions')
    .select('id, total_paid, total_value, savings, residual_balance, status, demo, created_at, cards_purchased, retailer_id, retailers(name)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (retailerFilter) {
    query = query.eq('retailer_id', retailerFilter);
  }

  const { data: transactions, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formatted = (transactions || []).map(tx => ({
    ...tx,
    retailer_name: (tx.retailers as unknown as { name: string })?.name || 'Unknown',
    retailers: undefined,
  }));

  return NextResponse.json({
    transactions: formatted,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}
