import { NextResponse } from 'next/server';
import { analyticsService } from '@/lib/services/analyticsService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const alerts = await analyticsService.getInventoryAlerts();
    return NextResponse.json(alerts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
