import { prisma } from '@/lib/prisma';

export async function logActivity(userId: string | null, username: string | null, action: string, details: string) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        username,
        action,
        details,
      }
    });
  } catch (error) {
    console.error('[AUDIT LOGGER] Failed to create audit log:', error);
  }
}
