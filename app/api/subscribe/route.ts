import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: existing, error: existingError } = await supabase
      .from('mi_email_subscribers')
      .select('id, is_active')
      .eq('email', email)
      .maybeSingle();

    if (existingError) {
      console.error('Subscriber lookup error:', existingError);
      return NextResponse.json({ error: 'Unable to subscribe' }, { status: 500 });
    }

    if (existing?.id) {
      if (existing.is_active === false) {
        const { error: reactivateError } = await supabase
          .from('mi_email_subscribers')
          .update({ is_active: true })
          .eq('id', existing.id);
        if (reactivateError) {
          console.error('Subscriber reactivate error:', reactivateError);
          return NextResponse.json({ error: 'Unable to subscribe' }, { status: 500 });
        }
      }
      return NextResponse.json({ status: 'already_subscribed' });
    }

    const { error } = await supabase.from('mi_email_subscribers').insert({
      email,
      source: 'popup',
      is_active: true,
    });

    if (error) {
      console.error('Subscriber insert error:', error);
      return NextResponse.json({ error: 'Unable to subscribe' }, { status: 500 });
    }

    return NextResponse.json({ status: 'subscribed' });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'Unable to subscribe' }, { status: 500 });
  }
}
