const pool = require('../config/db');

// fetch all orders (most recent first)
async function getAllOrders(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('getAllOrders error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// fetch single order by order_id
async function getOrder(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE order_id = $1',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('getOrder error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// update order status and optionally cancelled reason
async function updateOrderStatus(req, res) {
  const { id } = req.params;
  const { status, cancelledReason } = req.body;
  if (!status) return res.status(400).json({ message: 'status required' });
  try {
    await pool.query(
      `UPDATE orders SET status = $1, updated_at = NOW(), order_track = jsonb_set(coalesce(order_track,'[]'::jsonb), '{999}', $2::jsonb, true) WHERE order_id = $3`,
      [status, JSON.stringify({ status, time: new Date() }), id]
    );
    const updated = await pool.query('SELECT * FROM orders WHERE order_id = $1', [id]);
    res.json(updated.rows[0]);
  } catch (err) {
    console.error('updateOrderStatus error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// create new order
async function createOrder(req, res) {
  const data = req.body;
  if (!data.order_id) {
    return res.status(400).json({ message: 'order_id is required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO orders (order_id, user_id, status, payment_status, total, order_type, shipping, pickup, order_track)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        data.order_id,
        data.user_id || null,
        data.status || 'orderPlaced',
        data.payment_status || 'pending',
        data.total || 0,
        data.order_type || null,
        data.shipping ? JSON.stringify(data.shipping) : null,
        data.pickup ? JSON.stringify(data.pickup) : null,
        data.order_track ? JSON.stringify(data.order_track) : JSON.stringify([]),
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createOrder error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getAllOrders, getOrder, updateOrderStatus, createOrder };
