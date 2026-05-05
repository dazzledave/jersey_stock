const express = require('express');
const router = express.Router();
const { syncToCloud } = require('../services/syncService');

router.post('/', async (req, res) => {
  const { supabaseUrl, supabaseKey } = req.body;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(400).json({ error: 'Supabase URL and Key are required for synchronization.' });
  }

  try {
    const result = await syncToCloud(supabaseUrl, supabaseKey);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
