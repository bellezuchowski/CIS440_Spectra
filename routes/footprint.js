// routes/footprint.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// GET /api/footprint  -> return current values for the logged-in user
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.execute(
      'SELECT steps, walk_hours, run_hours, cycle_hours, hiking_hours, swimming_hours FROM `user` WHERE email = ? LIMIT 1',
      [req.user.email]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    return res.json({ inputs: rows[0] });
  } catch (e) {
    console.error('GET /api/footprint error:', e.message);
    return res.status(500).json({ error: 'Server error loading footprint' });
  } finally {
    if (conn) conn.release();
  }
});

// PATCH /api/footprint -> update only provided fields for the logged-in user
router.patch('/', async (req, res) => {
  const allowed = ['steps','walk_hours','run_hours','cycle_hours','hiking_hours','swimming_hours'];
  const fields = [];
  const params = [];

  try {
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, k)) {
        const num = Number(req.body[k]);
        if (!Number.isFinite(num) || num < 0) {
          return res.status(400).json({ error: `Invalid ${k}` });
        }
        fields.push(`\`${k}\` = ?`);       // backticks to avoid reserved words
        params.push(num);
      }
    }

    if (!fields.length) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(req.user.email);

    let conn;
    try {
      conn = await pool.getConnection();

      await conn.execute(
        `UPDATE \`user\` SET ${fields.join(', ')} WHERE email = ?`,
        params
      );

      const [rows] = await conn.execute(
        'SELECT steps, walk_hours, run_hours, cycle_hours, hiking_hours, swimming_hours FROM `user` WHERE email = ?',
        [req.user.email]
      );

      return res.json({ inputs: rows[0] || {} });
    } finally {
      if (conn) conn.release();
    }
  } catch (e) {
    console.error('PATCH /api/footprint error:', e.message);
    return res.status(500).json({ error: 'Server error updating footprint' });
  }
});

module.exports = router;
