// Diagnostic server only: never imported by app.js or started by npm start.
require('dotenv').config();
const crypto = require('node:crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/db');
const { installNotes } = require('./install');

if (process.env.NODE_ENV === 'production') throw new Error('Notes playground is disabled in production.');
const app = express();
app.locals.notesJwtSecret = crypto.randomBytes(48).toString('hex');
app.use(express.json());
app.post('/api/dev/session', async (req, res) => {
  const origin = req.headers.origin;
  if (origin && !['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname)) {
    return res.status(403).json({ error: { message: 'Local playground only.' } });
  }
  const id = Number(req.body.user_id);
  if (![1, 2, 3].includes(id)) return res.status(400).json({ error: { message: 'Chỉ nhận tài khoản seed 1, 2, 3.' } });
  const [rows] = await pool.execute('SELECT id, email, display_name FROM users WHERE id = ?', [id]);
  if (!rows.length) return res.status(404).json({ error: { message: 'Chưa có tài khoản mẫu. Chạy notes:setup -- --seed trên DB local.' } });
  const token = jwt.sign({ id }, app.locals.notesJwtSecret, { algorithm: 'HS256', expiresIn: '1h' });
  res.json({ token, user: rows[0] });
});
installNotes(app, pool);
app.listen(Number(process.env.NOTES_DEMO_PORT || process.env.PORT || 5000), '127.0.0.1', () => {
  console.log('Local-only notes playground ready. Open /notes-dev.html on the Vite frontend.');
});
