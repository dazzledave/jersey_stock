import { prisma } from '@/lib/prisma';
import { cloudSyncService } from '@/lib/services/cloudSyncService';

export async function logActivity(userId: string | null, username: string | null, action: string, details: string) {
  try {
    const log = await prisma.auditLog.create({
      data: {
        userId,
        username,
        action,
        details,
      }
    });
    cloudSyncService.queueSync('AuditLog', log.id).catch(console.error);
  } catch (error) {
    console.error('[AUDIT LOGGER] Failed to create audit log:', error);
  }
}
