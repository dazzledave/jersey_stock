import { NextResponse } from 'next/server';
import { cloudSyncService } from '@/lib/services/cloudSyncService';

export async function POST(request: Request) {
  try {
    const { supabaseUrl, supabaseKey } = await request.json();
    await cloudSyncService.saveCredentials(supabaseUrl, supabaseKey);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
