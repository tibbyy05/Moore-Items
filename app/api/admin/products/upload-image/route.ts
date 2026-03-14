import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const BUCKET_NAME = 'gallery-photos';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: adminProfile } = await supabase
    .from('mi_admin_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!adminProfile) {
    return { error: NextResponse.json({ error: 'Not an admin' }, { status: 403 }) };
  }

  return { error: null };
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const variantId = formData.get('variantId') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!variantId) {
    return NextResponse.json({ error: 'No variantId provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Only JPEG, PNG, WebP, and GIF images are allowed' },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 20 MB)' }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  // Generate unique filename
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
  const uniqueName = `variants/${variantId}/${randomUUID()}-${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { data, error: uploadError } = await adminSupabase.storage
    .from(BUCKET_NAME)
    .upload(uniqueName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('[Upload Image] Storage error:', uploadError);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  const { data: urlData } = adminSupabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

  return NextResponse.json({ url: urlData.publicUrl });
}
