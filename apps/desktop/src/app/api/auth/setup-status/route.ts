import { NextResponse } from 'next/server';
import { authService } from '@/lib/services/authService';

export async function GET() {
  try {
    const status = await authService.checkSetupStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
