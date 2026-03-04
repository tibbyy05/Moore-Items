require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data, error } = await supabase
    .from('mi_product_variants')
    .select('id, name, color, size, image_url, is_active')
    .eq('product_id', '1e02a272-df05-4981-9425-c314172886e1')
    .eq('is_active', true)
    .order('color')
    .order('name');

  if (error) { console.error(error); return; }
  console.log('Active variants: ' + data.length + '\n');
  for (let i = 0; i < data.length; i++) {
    const v = data[i];
    console.log((i + 1) + '. ' + v.name);
    console.log('   Color: ' + v.color + (v.size ? ' | Size: ' + v.size : ''));
    console.log('   Image: ' + (v.image_url || 'NONE'));
    console.log('   ID: ' + v.id);
    console.log('');
  }
})();
