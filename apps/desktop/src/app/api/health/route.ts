import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'online', database: 'connected' });
  } catch (error: any) {
    console.error('Health check failed:', error);
    return NextResponse.json({ status: 'offline', error: error.message }, { status: 500 });
  }
}
