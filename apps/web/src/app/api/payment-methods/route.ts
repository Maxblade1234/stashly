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
      is_default: true,
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
