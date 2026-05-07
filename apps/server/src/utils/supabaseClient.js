const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let supabaseAdmin = null;

const getSupabaseAdmin = async () => {
  if (supabaseAdmin) return supabaseAdmin;

  // 1. Try from .env
  let url = process.env.SUPABASE_URL;
  let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 2. If not in .env, check the database settings (fallback for URL)
  if (!url) {
    const urlSetting = await prisma.setting.findUnique({ where: { key: 'supabaseUrl' } });
    url = urlSetting?.value;
  }

  // NOTE: Service Role Key should REALLY be in .env for security.
  // We don't store the service role key in the public settings table.
  
  if (!url || !serviceKey) {
    console.warn('[SUPABASE] Supabase URL or Service Role Key missing. Cloud auth features will be disabled.');
    return null;
  }

  const sanitizedUrl = url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  const sanitizedKey = serviceKey.trim();

  supabaseAdmin = createClient(sanitizedUrl, sanitizedKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return supabaseAdmin;
};

module.exports = { getSupabaseAdmin };
