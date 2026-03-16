import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase: null, user: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return { supabase: null, user: null };
  return { supabase, user };
}

export async function GET() {
  const { supabase } = await checkAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: retailers, error } = await supabase
    .from('retailers')
    .select('*')
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ retailers });
}

export async function POST(request: NextRequest) {
  const { supabase } = await checkAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from('retailers')
    .upsert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ retailer: data });
}
