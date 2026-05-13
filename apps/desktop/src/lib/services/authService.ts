import { prisma } from '../prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getSupabaseAdmin } from '../utils/supabaseClient';
import { cloudSyncService } from './cloudSyncService';

const JWT_SECRET = process.env.JWT_SECRET || 'awards-centre-pos-secret-key-2024';

export const authService = {
  checkSetupStatus: async () => {
    const userCount = await prisma.user.count();
    return { initialized: userCount > 0 };
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
    const supabase = await getSupabaseAdmin();
    
    let supabaseUser = null;
    let authError = null;

    if (supabase) {
      try {
        const email = `${username.toLowerCase()}@jersey-stock.com`;
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (!signInError && data.user) {
          supabaseUser = data.user;
          console.log(`[AUTH] Cloud login successful for: ${username}`);
        } else {
          authError = signInError?.message;
          if (signInError && !signInError.message.includes('Invalid login credentials')) {
            console.warn(`[AUTH] Supabase signIn error: ${signInError.message}`);
          }
        }
      } catch (err: any) {
        console.warn(`[AUTH] Supabase check failed (offline?): ${err.message}`);
      }
    }

    let localUser = await prisma.user.findUnique({
      where: { username }
    });

    if (supabaseUser && !localUser) {
      console.log(`[AUTH] Creating local profile for cloud user: ${username}`);
      const hashedPassword = await bcrypt.hash(password, 10);
      localUser = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          role: 'STAFF'
        }
      });
      cloudSyncService.queueSync('User', localUser.id).catch(console.error);
    }

    if (!localUser) {
      throw new Error('Invalid credentials.');
    }

    if (!supabaseUser) {
      const isMatch = await bcrypt.compare(password, localUser.password);
      if (!isMatch) {
        throw new Error(authError || 'Invalid credentials.');
      }
      console.log(`[AUTH] Local login successful for: ${username}`);
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
