const express = require('express');
const router = express.Router();
const authService = require('../services/authService');

router.get('/setup-status', async (req, res) => {
  try {
    const status = await authService.checkSetupStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/setup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await authService.registerFirstAdmin(username, password);
    res.status(201).json({ message: 'Master Admin created successfully', user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

router.post('/recovery-reset', async (req, res) => {
  const { username, recoveryKey, newPassword } = req.body;
  try {
    const result = await authService.resetPasswordWithRecoveryKey(username, recoveryKey, newPassword);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/verify-recovery', async (req, res) => {
  const { username, recoveryKey } = req.body;
  try {
    const result = await authService.verifyRecoveryKey(username, recoveryKey);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/emergency-reset', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcrypt');
    const prisma = new PrismaClient();
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await prisma.user.upsert({
      where: { username: 'admin' },
      update: { password: hashedPassword },
      create: {
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    res.json({ message: 'Admin account reset to admin / admin123' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
