const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Middleware to verify Admin role would go here
// For now, these are basic routes for staff management

router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        visiblePassword: true,
        createdAt: true
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        visiblePassword: password, // Store plain for admin oversight
        role: role || 'STAFF'
      }
    });

    // Sync to Supabase Auth (Online only)
    const { getSupabaseAdmin } = require('../utils/supabaseClient');
    const supabase = await getSupabaseAdmin();
    if (supabase) {
      const email = `${username.toLowerCase()}@jersey-stock.com`;
      const { error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: role || 'STAFF', username }
      });
      if (error) console.error(`[SUPABASE] Failed to create auth user: ${error.message}`);
    }

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Self-service profile update
router.put('/profile', async (req, res) => {
  const { userId, username, password, role } = req.body;
  try {
    const data = {};
    if (username) data.username = username;
    if (role) data.role = role;
    if (password) {
      data.password = await bcrypt.hash(password, 10);
      data.visiblePassword = password; // Keep admin oversight in sync
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data
    });

    // Sync to Supabase Auth (Online only)
    const { getSupabaseAdmin } = require('../utils/supabaseClient');
    const supabase = await getSupabaseAdmin();
    if (supabase) {
      const email = `${user.username.toLowerCase()}@jersey-stock.com`;
      const updateData = { user_metadata: { role: user.role } };
      if (password) updateData.password = password;
      
      // Get user by email to get their ID
      const { data: userData } = await supabase.auth.admin.getUserByEmail(email);
      if (userData.user) {
        await supabase.auth.admin.updateUserById(userData.user.id, updateData);
      }
    }

    res.json({ message: 'Profile updated successfully', user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
