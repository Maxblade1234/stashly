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
