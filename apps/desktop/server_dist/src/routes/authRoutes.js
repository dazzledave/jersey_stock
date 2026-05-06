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
  const { username, password } = req.body;
  try {
    const result = await authService.login(username, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

module.exports = router;
