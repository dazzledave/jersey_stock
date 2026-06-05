import { NextResponse } from 'next/server';
import { analyticsService } from '@/lib/services/analyticsService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const detailed = await analyticsService.getDetailedAnalytics(range, startDate, endDate);
    return NextResponse.json(detailed);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
