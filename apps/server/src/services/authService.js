const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'awards-centre-pos-secret-key-2024';

const authService = {
  checkSetupStatus: async () => {
    const userCount = await prisma.user.count();
    return { initialized: userCount > 0 };
  },

  registerFirstAdmin: async (username, password) => {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      throw new Error('Initial setup already completed.');
    }

    // Generate a 12-digit recovery key (Format: XXXX-XXXX-XXXX)
    const generateKey = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O, 0, I, 1 to avoid confusion
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

    return { ...user, rawRecoveryKey: recoveryKey };
  },

  resetPasswordWithRecoveryKey: async (username, recoveryKey, newPassword) => {
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
        password: hashedPassword,
        visiblePassword: newPassword // For portable dist debugging
      }
    });

    return { success: true };
  },

  login: async (username, password) => {
    // 1. Attempt Supabase Auth (Cloud Source of Truth)
    const { getSupabaseAdmin } = require('../utils/supabaseClient');
    const supabase = await getSupabaseAdmin();
    
    let supabaseUser = null;
    let authError = null;

    if (supabase) {
      try {
        // Map username to email for Supabase Auth
        const email = `${username.toLowerCase()}@jersey-stock.com`;
        
        // Try to verify password directly via Supabase Auth
        // This checks the auth.users table
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (!signInError && data.user) {
          supabaseUser = data.user;
          console.log(`[AUTH] Cloud login successful for: ${username}`);
        } else {
          authError = signInError?.message;
          // Only log warnings for non-credential errors (like connection issues)
          if (signInError && !signInError.message.includes('Invalid login credentials')) {
            console.warn(`[AUTH] Supabase signIn error: ${signInError.message}`);
          }
        }
      } catch (err) {
        console.warn(`[AUTH] Supabase check failed (offline?): ${err.message}`);
      }
    }

    // 2. Fallback / Parallel check against Local DB
    let localUser = await prisma.user.findUnique({
      where: { username }
    });

    // AUTO-SYNC: If cloud login was successful but user doesn't exist locally, create them
    if (supabaseUser && !localUser) {
      console.log(`[AUTH] Creating local profile for cloud user: ${username}`);
      const hashedPassword = await bcrypt.hash(password, 10);
      localUser = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          role: 'STAFF', // Default to STAFF for auto-created users
          visiblePassword: password // Helpful for portable distribution debugging
        }
      });
    }

    if (!localUser) {
      throw new Error('Invalid credentials.');
    }

    // If cloud login succeeded, we trust it. 
    // If cloud failed (offline or wrong creds), we verify against local hash.
    if (!supabaseUser) {
      const isMatch = await bcrypt.compare(password, localUser.password);
      if (!isMatch) {
        throw new Error(authError || 'Invalid credentials.');
      }
      console.log(`[AUTH] Local login successful for: ${username}`);
    }

    // Update local user data if cloud login was successful (sync down)
    // Note: In a full sync, you'd update roles here too.

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

module.exports = authService;
