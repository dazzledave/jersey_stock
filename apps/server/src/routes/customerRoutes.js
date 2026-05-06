const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cloudSyncService = require('../services/cloudSyncService');

// Get all customers with their sale count
router.get('/', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        _count: {
          select: { sales: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new customer
router.post('/', async (req, res) => {
  const { name, phone, email, address } = req.body;
  try {
    const customer = await prisma.customer.create({
      data: { name, phone, email, address }
    });
    cloudSyncService.queueSync('Customer', customer.id).catch(console.error);
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  const { name, phone, email, address } = req.body;
  try {
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: { name, phone, email, address }
    });
    cloudSyncService.queueSync('Customer', customer.id).catch(console.error);
    res.json(customer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    await prisma.customer.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
