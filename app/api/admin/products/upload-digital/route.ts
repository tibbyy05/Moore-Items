import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const BUCKET_NAME = 'digital-products';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

async function requireAdmin(request: NextRequest) {
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
  const { error } = await requireAdmin(request);
  if (error) return error;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 50 MB)' }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  // Ensure the private bucket exists (idempotent)
  try {
    const { data: buckets } = await adminSupabase.storage.listBuckets();
    const bucketExists = (buckets || []).some(
      (b: { name: string }) => b.name === BUCKET_NAME
    );
    if (!bucketExists) {
      const { error: bucketError } = await adminSupabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: MAX_FILE_SIZE,
      });
      if (bucketError) {
        console.error('[Upload Digital] Bucket creation error:', bucketError);
        return NextResponse.json({ error: 'Failed to create storage bucket' }, { status: 500 });
      }
    }
  } catch (bucketErr) {
    console.error('[Upload Digital] Bucket check error:', bucketErr);
    return NextResponse.json({ error: 'Storage service unavailable' }, { status: 500 });
  }

  // Generate unique filename
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
  const uniqueName = `${randomUUID()}-${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { data, error: uploadError } = await adminSupabase.storage
    .from(BUCKET_NAME)
    .upload(uniqueName, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) {
    console.error('[Upload Digital] Storage error:', uploadError);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  return NextResponse.json({ path: data.path });
}
