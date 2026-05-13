import { NextResponse } from 'next/server';
import { syncToCloud } from '@/lib/services/syncService';

export async function POST(request: Request) {
  try {
    const { supabaseUrl, supabaseKey } = await request.json();

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase URL and Key are required for synchronization.' }, { status: 400 });
    }

    const result = await syncToCloud(supabaseUrl, supabaseKey);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
