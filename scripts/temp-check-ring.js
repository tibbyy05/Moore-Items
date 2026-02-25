require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await sb
    .from('mi_products')
    .select('id, name, images, cj_pid')
    .eq('slug', 'sterling-silver-jewelry-couple-ring-female-wedding-ring-pair-ring-d7ki')
    .single();

  if (error) { console.error(error); return; }

  console.log('Product:', data.name);
  console.log('CJ PID:', data.cj_pid);
  console.log('ID:', data.id);
  console.log(`\nImages array (${data.images.length}):\n`);
  data.images.forEach((img, i) => {
    console.log(`  [${i}] ${img}`);
  });
}

run();
