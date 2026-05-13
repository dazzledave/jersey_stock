import { NextResponse } from 'next/server';
import { settingsService } from '@/lib/services/settingsService';

export async function GET() {
  try {
    const settings = await settingsService.getAllSettings();
    return NextResponse.json(settings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const settings = await settingsService.updateSettings(body);
    return NextResponse.json(settings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
