import { NextResponse } from 'next/server';
import { syncToCloud } from '@/lib/services/syncService';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    let supabaseUrl = body.supabaseUrl;
    let supabaseKey = body.supabaseKey;

    // Fallback to environment variables if not sent in the request body (for hardcoded production setup)
    if (!supabaseUrl || !supabaseKey) {
      supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    }

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase URL and Key are required for database synchronization.' }, { status: 400 });
    }

    const result = await syncToCloud(supabaseUrl, supabaseKey);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
