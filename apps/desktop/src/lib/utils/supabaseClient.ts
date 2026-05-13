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
  
  if (!serviceKey) {
    const keySetting = await prisma.setting.findUnique({ where: { key: 'supabaseKey' } });
    serviceKey = keySetting?.value;
  }
  
  if (!url || !serviceKey) {
    return null;
  }

  const sanitizedUrl = (url || '').trim().replace(/['"]/g, '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  const sanitizedKey = (serviceKey || '').trim().replace(/['"]/g, '');

  supabaseAdmin = createClient(sanitizedUrl, sanitizedKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    realtime: {
      // @ts-ignore
      transport: WebSocket
    }
  });

  return supabaseAdmin;
};
