import { NextResponse } from 'next/server';
import { authService } from '@/lib/services/authService';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const user = await authService.registerFirstAdmin(username, password);
    return NextResponse.json({ message: 'Master Admin created successfully', user }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
