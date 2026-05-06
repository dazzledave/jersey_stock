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
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Self-service profile update
router.put('/profile', async (req, res) => {
  const { userId, username, password } = req.body;
  try {
    const data = {};
    if (username) data.username = username;
    if (password) {
      data.password = await bcrypt.hash(password, 10);
      data.visiblePassword = password; // Keep admin oversight in sync
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data
    });
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
