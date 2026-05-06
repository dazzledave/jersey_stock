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
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      throw new Error('Invalid credentials.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials.');
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    };
  }
};

module.exports = authService;
