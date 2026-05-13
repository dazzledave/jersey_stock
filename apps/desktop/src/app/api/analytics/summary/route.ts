import { NextResponse } from 'next/server';
import { analyticsService } from '@/lib/services/analyticsService';

export async function GET() {
  try {
    const summary = await analyticsService.getSummary();
    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
