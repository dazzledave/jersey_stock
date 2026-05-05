const express = require('express');
const router = express.Router();
const salesService = require('../services/salesService');

router.get('/', async (req, res) => {
  try {
    const sales = await salesService.getAllSales();
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const sale = await salesService.createSale(req.body);
    req.io.emit('sale_created', sale);
    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
