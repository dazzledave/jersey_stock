import { NextResponse } from 'next/server';
import { authService } from '@/lib/services/authService';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const result = await authService.login(username, password);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
