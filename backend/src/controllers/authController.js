const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

// register a new user
async function register(req, res) {
  const { username, email, mobile, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, username, mobile)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, role, username, mobile`,
      [email, hashed, 'user', username || null, mobile || null]
    );

    const user = result.rows[0];
    return res.status(201).json({ user });
  } catch (err) {
    // unique violation (23505) covers both email and username uniquely constrained
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Email or username already exists' });
    }

    logger.error('register error: %O', err);
    return res.status(500).json({ message: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
}

// login existing user
async function login(req, res) {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ message: 'identifier and password are required' });
  }

  try {
    logger.info('login attempt for identifier: %s', identifier);
    const q = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $1',
      [identifier]
    );

    if (q.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = q.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // strip password_hash before sending user back
    const { password_hash, ...userData } = user;
    res.json({ token, user: userData });
  } catch (err) {
    logger.error('login error: %O', err);
    res.status(500).json({ message: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
}

module.exports = { register, login };