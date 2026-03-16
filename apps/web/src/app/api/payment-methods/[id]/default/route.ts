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

  // Set new default first (safer ordering — crash leaves 2 defaults, not 0)
  await supabase.from('payment_methods')
    .update({ is_default: true })
    .eq('processor_method_id', id)
    .eq('user_id', user.id);

  await supabase.from('payment_methods')
    .update({ is_default: false })
    .eq('user_id', user.id)
    .neq('processor_method_id', id);

  return NextResponse.json({ success: true });
}
