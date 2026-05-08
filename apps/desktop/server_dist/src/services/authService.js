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

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    return user;
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
    const localUser = await prisma.user.findUnique({
      where: { username }
    });

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
