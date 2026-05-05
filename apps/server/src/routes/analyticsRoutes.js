const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');

router.get('/summary', async (req, res) => {
  try {
    const summary = await analyticsService.getSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/low-stock', async (req, res) => {
  try {
    const alerts = await analyticsService.getInventoryAlerts();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
