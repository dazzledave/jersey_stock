import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/utils/auditLogger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');

    await prisma.auditLog.deleteMany({});
    
    // Log the purge action itself!
    await logActivity(userId, username, "AUDIT_LOGS_PURGED", "All system audit/activity logs have been cleared.");
    
    return NextResponse.json({ message: "Audit logs cleared successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
