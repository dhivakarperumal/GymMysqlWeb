const pool = require('../config/db');

// Helper function to parse JSON fields
const parseOrder = (order) => {
  if (!order) return order;
  return {
    ...order,
    shipping: typeof order.shipping === 'string' ? JSON.parse(order.shipping || '{}') : (order.shipping || {}),
    pickup: typeof order.pickup === 'string' ? JSON.parse(order.pickup || '{}') : (order.pickup || {}),
    order_track: typeof order.order_track === 'string' ? JSON.parse(order.order_track || '[]') : (order.order_track || [])
  };
};

// fetch all orders (most recent first)
async function getAllOrders(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );
    return res.json(rows.map(parseOrder));
  } catch (err) {
    console.error('getAllOrders error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// fetch single order by order_id
async function getOrder(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM orders WHERE order_id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    return res.json(parseOrder(rows[0]));
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
    // Get the current order_track
    const [existingOrder] = await pool.query(
      'SELECT order_track FROM orders WHERE order_id = ?',
      [id]
    );

    let trackArray = [];
    if (existingOrder.length > 0 && existingOrder[0].order_track) {
      try {
        trackArray = JSON.parse(existingOrder[0].order_track);
      } catch (e) {
        trackArray = [];
      }
    }
    
    // Add new status to track
    trackArray.push({ status, time: new Date() });

    await pool.query(
      `UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP, order_track = ? WHERE order_id = ?`,
      [status, JSON.stringify(trackArray), id]
    );
    
    const [updated] = await pool.query('SELECT * FROM orders WHERE order_id = ?', [id]);
    res.json(parseOrder(updated[0]));
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
    const [result] = await pool.query(
      `INSERT INTO orders (order_id, user_id, status, payment_status, total, order_type, shipping, pickup, order_track)
       VALUES (?,?,?,?,?,?,?,?,?)`,
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

    // Fetch the created order
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [result.insertId]);
    res.status(201).json(parseOrder(rows[0]));
  } catch (err) {
    console.error('createOrder error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getAllOrders, getOrder, updateOrderStatus, createOrder };
