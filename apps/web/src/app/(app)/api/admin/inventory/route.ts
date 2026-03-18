import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const INVENTORY_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3001';
const SERVICE_KEY = process.env.INVENTORY_SERVICE_KEY || '';

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin' ? user : null;
}

export async function GET() {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const res = await fetch(`${INVENTORY_URL}/admin/summary`, {
      headers: { 'x-service-key': SERVICE_KEY },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Inventory service unavailable' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();

  try {
    const res = await fetch(`${INVENTORY_URL}/admin/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-key': SERVICE_KEY,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Inventory service unavailable' }, { status: 503 });
  }
}
