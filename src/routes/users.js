const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  const { name, email } = req.body ?? {};

  if (typeof name !== 'string' || !name.trim() ||
      typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name.trim(), email.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
