import { NextResponse } from 'next/server';
import { analyticsService } from '@/lib/services/analyticsService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const detailed = await analyticsService.getDetailedAnalytics();
    return NextResponse.json(detailed);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
