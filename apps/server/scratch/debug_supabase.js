const { getSupabaseAdmin } = require('../src/utils/supabaseClient');
require('dotenv').config();

async function checkMethods() {
  const supabase = await getSupabaseAdmin();
  if (!supabase) {
    console.log('Supabase client is null');
    return;
  }
  
  console.log('Auth Admin keys:', Object.keys(supabase.auth.admin));
}

checkMethods();
