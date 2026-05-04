const express = require('express');
const router = express.Router();
const inventoryService = require('../services/inventoryService');

router.post('/adjust', async (req, res) => {
  const { variantId, quantityChange, type, reason } = req.body;
  try {
    const inventory = await inventoryService.updateStock(variantId, quantityChange, type, reason);
    req.io.emit('stock_updated', { variantId, quantity: inventory.quantity });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/low-stock', async (req, res) => {
  try {
    const lowStockItems = await inventoryService.getLowStockItems();
    res.json(lowStockItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
