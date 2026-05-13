import { NextResponse } from 'next/server';
import { authService } from '@/lib/services/authService';

export async function POST(request: Request) {
  try {
    const { username, recoveryKey } = await request.json();
    const result = await authService.verifyRecoveryKey(username, recoveryKey);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
