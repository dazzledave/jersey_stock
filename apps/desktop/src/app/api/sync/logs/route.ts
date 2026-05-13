import { NextResponse } from 'next/server';
import { clearLogs } from '@/lib/services/syncService';

export async function DELETE() {
  try {
    await clearLogs();
    return NextResponse.json({ success: true, message: 'Sync logs cleared successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
