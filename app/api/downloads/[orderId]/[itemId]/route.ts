import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { verifyDownloadToken } from '@/lib/download-token';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string; itemId: string } }
) {
  try {
    const { orderId, itemId } = params;
    const token = request.nextUrl.searchParams.get('token');

    const adminSupabase = createAdminClient();

    // --- AUTH: Either valid token OR authenticated user ---
    if (token) {
      // Token-based access (for email download links / guest checkout)
      if (!verifyDownloadToken(orderId, itemId, token)) {
        return NextResponse.json({ error: 'Invalid download link' }, { status: 403 });
      }
    } else {
      // Session-based access (for logged-in users from order history)
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Verify order belongs to this user
      const { data: order } = await adminSupabase
        .from('mi_orders')
        .select('id, email')
        .eq('id', orderId)
        .single();

      if (!order || order.email?.toLowerCase() !== user.email.toLowerCase()) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // --- VERIFY ORDER IS PAID ---
    const { data: order, error: orderError } = await adminSupabase
      .from('mi_orders')
      .select('id, payment_status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Order not paid' }, { status: 403 });
    }

    // --- GET ORDER ITEM ---
    const { data: orderItem, error: itemError } = await adminSupabase
      .from('mi_order_items')
      .select('id, product_id')
      .eq('id', itemId)
      .eq('order_id', orderId)
      .single();

    if (itemError || !orderItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // --- GET DIGITAL FILE ---
    const { data: product, error: productError } = await adminSupabase
      .from('mi_products')
      .select('id, digital_file_path')
      .eq('id', orderItem.product_id)
      .single();

    if (productError || !product || !product.digital_file_path) {
      return NextResponse.json({ error: 'This item is not a digital product' }, { status: 400 });
    }

    // Generate a signed URL (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await adminSupabase.storage
      .from('digital-products')
      .createSignedUrl(product.digital_file_path, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('[Download] Signed URL error:', signedUrlError);
      return NextResponse.json({ error: 'Unable to generate download link' }, { status: 500 });
    }

    return NextResponse.redirect(signedUrlData.signedUrl);
  } catch (error) {
    console.error('[Download] Error:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
