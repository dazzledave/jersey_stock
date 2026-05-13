import { createClient, SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { prisma } from '../prisma';

let supabaseAdmin: SupabaseClient | null = null;

export const getSupabaseAdmin = async () => {
  if (supabaseAdmin) return supabaseAdmin;

  let url = process.env.SUPABASE_URL;
  let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    const urlSetting = await prisma.setting.findUnique({ where: { key: 'supabaseUrl' } });
    url = urlSetting?.value;
  }
  
  if (!url || !serviceKey) {
    console.warn('[SUPABASE] Supabase URL or Service Role Key missing. Cloud auth features will be disabled.');
    return null;
  }

  const sanitizedUrl = (url || '').trim().replace(/['"]/g, '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  const sanitizedKey = (serviceKey || '').trim().replace(/['"]/g, '');

  supabaseAdmin = createClient(sanitizedUrl, sanitizedKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    // @ts-ignore
    realtime: {
      transport: WebSocket
    }
  });

  return supabaseAdmin;
};
