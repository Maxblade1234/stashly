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
