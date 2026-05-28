import { NextResponse } from 'next/server';
import { cloudSyncService } from '@/lib/services/cloudSyncService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await cloudSyncService.getSupabaseClient();
    if (!supabase) {
      console.log('[HEARTBEAT] No Supabase client available (No keys found).');
      return NextResponse.json({ cloudConnected: false, reason: 'No Keys Found' });
    }

    // Attempt a lightweight ping to Supabase with a 3-second timeout to prevent hanging when network drops
    const pingPromise = supabase.from('users').select('id', { count: 'exact', head: true }).limit(1);
    const timeoutPromise = new Promise<any>((_, reject) => 
      setTimeout(() => reject(new Error('Connection Timeout')), 3000)
    );

    const { error } = await Promise.race([pingPromise, timeoutPromise]);
    
    if (error) {
      console.error('[HEARTBEAT] Supabase Ping Failed:', error.message);
      return NextResponse.json({ cloudConnected: false, reason: error.message });
    }

    return NextResponse.json({ cloudConnected: true });
  } catch (err: any) {
    return NextResponse.json({ 
      cloudConnected: false, 
      error: err.message 
    });
  }
}
