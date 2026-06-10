import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getSupabaseAdmin } from '../utils/supabaseClient';
import { cloudSyncService } from './cloudSyncService';

const JWT_SECRET = process.env.JWT_SECRET || 'awards-centre-pos-secret-key-2024';

export const authService = {
  checkSetupStatus: async () => {
    // If online, check if the cloud database has been wiped/reset to 0 users
    try {
      const supabase = await cloudSyncService.getSupabaseClient();
      if (supabase) {
        const { count, error } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        if (!error && count === 0) {
          console.log('[SETUP] Cloud database has 0 users (wiped). Resetting local users state.');
          await prisma.user.deleteMany({});
          return { status: 'setup_required' };
        }
      }
    } catch (err) {
      console.warn('[SETUP] Cloud setup check failed, using local fallback.');
    }

    const localUserCount = await prisma.user.count();
    if (localUserCount > 0) return { status: 'initialized' };

    // If no local users, check Supabase fallback to see if we should downsync
    try {
      const supabase = await cloudSyncService.getSupabaseClient();
      if (!supabase) {
        return { status: 'offline_first_use', error: 'Cloud configuration missing.' };
      }

      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;

      if (count && count > 0) {
        console.log(`[SETUP] Found ${count} users in cloud. Performing background downsync...`);
        await cloudSyncService.performDownsync();
        return { status: 'initialized' };
      } else {
        return { status: 'setup_required' };
      }
    } catch (err: any) {
      console.warn('[SETUP] Cloud fallback check failed:', err.message);
      return { status: 'offline_first_use', error: err.message || 'No internet connection' };
    }
  },

  registerFirstAdmin: async (username: string, password: string) => {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      throw new Error('Initial setup already completed.');
    }

    const generateKey = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const segment = () => Array.from({length: 4}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
      return `${segment()}-${segment()}-${segment()}`;
    };

    const recoveryKey = generateKey();
    const hashedRecoveryKey = await bcrypt.hash(recoveryKey, 10);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        recoveryKey: hashedRecoveryKey,
        role: 'ADMIN'
      }
    });

    // Auto-link Supabase from .env if settings are missing
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      await prisma.setting.upsert({
        where: { key: 'supabaseUrl' },
        update: { value: supabaseUrl },
        create: { key: 'supabaseUrl', value: supabaseUrl }
      });
      await prisma.setting.upsert({
        where: { key: 'supabaseKey' },
        update: { value: supabaseKey },
        create: { key: 'supabaseKey', value: supabaseKey }
      });
      console.log('[SETUP] Auto-linked Supabase credentials from .env');
    }
    
    cloudSyncService.queueSync('User', user.id).catch(console.error);

    return { ...user, rawRecoveryKey: recoveryKey };
  },

  resetPasswordWithRecoveryKey: async (username: string, recoveryKey: string, newPassword: string) => {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.recoveryKey) {
      throw new Error('User not found or recovery not enabled.');
    }

    const isMatch = await bcrypt.compare(recoveryKey.toUpperCase(), user.recoveryKey);
    if (!isMatch) {
      throw new Error('Invalid recovery key.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword
      }
    });

    // Sync to Supabase Auth
    try {
      const supabase = await getSupabaseAdmin();
      if (supabase) {
        const email = `${user.username.toLowerCase()}@jersey-stock.com`;
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (!listError) {
          const authUser = users.find(u => u.email === email);
          if (authUser) {
            await supabase.auth.admin.updateUserById(authUser.id, { password: newPassword });
            console.log(`[AUTH] Synced new password to Cloud Auth for: ${user.username}`);
          }
        }
      }
    } catch (err) {
      console.warn('[AUTH] Could not sync reset password to cloud, will rely on next login');
    }

    cloudSyncService.queueSync('User', user.id).catch(console.error);
    return { success: true };
  },

  verifyRecoveryKey: async (username: string, recoveryKey: string) => {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.recoveryKey) {
      throw new Error('User not found or recovery not enabled.');
    }

    const isMatch = await bcrypt.compare(recoveryKey.toUpperCase(), user.recoveryKey);
    if (!isMatch) {
      throw new Error('Invalid recovery key.');
    }

    return { success: true };
  },
  login: async (username: string, password: string) => {
    let localUser = await prisma.user.findUnique({
      where: { username }
    });

    let cloudUserFound = false;
    let isOnline = false;

    // Try to sync latest credentials/role/status from cloud if online
    try {
      const supabase = await cloudSyncService.getSupabaseClient();
      if (supabase) {
        isOnline = true;
        const { data: cloudUser, error: cloudError } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .maybeSingle();

        if (!cloudError && cloudUser) {
          cloudUserFound = true;
          if (localUser) {
            console.log(`[AUTH] Syncing user ${username} role/status from cloud on login.`);
            localUser = await prisma.user.update({
              where: { id: localUser.id },
              data: {
                role: cloudUser.role,
                isActive: cloudUser.isActive ?? true,
                password: cloudUser.password,
                recoveryKey: cloudUser.recoveryKey
              }
            });
          } else {
            console.log(`[AUTH] Found cloud user: ${username}. Cloning to local...`);
            localUser = await prisma.user.create({
              data: {
                id: cloudUser.id,
                username: cloudUser.username,
                password: cloudUser.password,
                role: cloudUser.role,
                isActive: cloudUser.isActive ?? true,
                recoveryKey: cloudUser.recoveryKey
              }
            });
          }
        }
      }
    } catch (err: any) {
      console.warn(`[AUTH] Cloud user sync failed, using local fallback: ${err.message}`);
    }

    // If online, but user does not exist in the master database (cloud), delete them locally
    if (isOnline && !cloudUserFound) {
      if (localUser) {
        console.log(`[AUTH] User ${username} not found in cloud (deleted). Deleting local copy.`);
        await prisma.user.delete({ where: { id: localUser.id } });
      }
      throw new Error('Invalid credentials.');
    }

    if (!localUser) {
      throw new Error('Invalid credentials.');
    }

    // Check account status
    if (typeof (localUser as any).isActive === 'boolean' && !(localUser as any).isActive) {
      throw new Error('This account has been deactivated / disabled by an Administrator.');
    }

    // Verify password (works for both local and cloned users)
    const isMatch = await bcrypt.compare(password, localUser.password);
    if (!isMatch) {
      throw new Error('Invalid credentials.');
    }

    // Update lastLogin timestamp and log login audit trail
    try {
      await prisma.user.update({
        where: { id: localUser.id },
        data: { lastLogin: new Date() }
      });
      const log = await prisma.auditLog.create({
        data: {
          userId: localUser.id,
          username: localUser.username,
          action: 'USER_LOGIN',
          details: `User "${localUser.username}" logged in successfully to POS.`
        }
      });
      cloudSyncService.queueSync('AuditLog', log.id).catch(console.error);
      cloudSyncService.queueSync('User', localUser.id).catch(console.error);
    } catch (auditErr) {
      console.warn('Failed to save lastLogin / login audit trail:', auditErr);
    }

    const token = jwt.sign(
      { id: localUser.id, username: localUser.username, role: localUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: localUser.id,
        username: localUser.username,
        role: localUser.role
      }
    };
  }
};
