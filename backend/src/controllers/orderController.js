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

    const [order] = await pool.query(
      "SELECT * FROM orders WHERE order_id = ?",
      [id]
    );

    if (order.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const [items] = await pool.query(
      "SELECT * FROM order_items WHERE order_id = ?",
      [id]
    );

    res.json({
      ...order[0],
      items
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
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
  console.log("Creating order with data:", data);

  if (!data.order_id) {
    console.error("Missing order_id");
    return res.status(400).json({ message: "order_id required" });
  }

  // normalize order_id formatting (ensure ORD### pattern)
  if (typeof data.order_id === 'string') {
    const num = parseInt(data.order_id.replace(/[^0-9]/g, ''), 10) || 0;
    data.order_id = `ORD${String(num).padStart(3, '0')}`;
  }
  console.log("Normalized order_id:", data.order_id);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    console.log("Transaction started");

    // Insert order
    const insertOrderQuery = `INSERT INTO orders 
      (order_id,user_id,status,payment_status,total,order_type,shipping,pickup,order_track)
      VALUES (?,?,?,?,?,?,?,?,?)`;
    
    const orderValues = [
      data.order_id,
      data.user_id || null,
      data.status || "orderPlaced",
      data.payment_status || "pending",
      data.total || 0,
      data.order_type || null,
      data.shipping ? JSON.stringify(data.shipping) : null,
      data.pickup ? JSON.stringify(data.pickup) : null,
      JSON.stringify(data.order_track || [])
    ];
    
    console.log("Inserting order with values:", orderValues);
    await connection.query(insertOrderQuery, orderValues);
    console.log("Order inserted successfully");

    // Insert order items (frontend may send various key names)
    if (Array.isArray(data.items) && data.items.length > 0) {
      console.log("Inserting", data.items.length, "order items");
      
      for (const raw of data.items) {
        // normalise keys from frontend
        const product_id = raw.product_id || raw.productId || null;
        const product_name = raw.product_name || raw.name || null;
        const price = raw.price || 0;
        const qty = raw.qty || raw.quantity || 0;
        const size = raw.size || raw.weight || null;
        const color = raw.color || null;
        // image may be array or single
        let image = raw.image || "";
        if (!image && raw.images) {
          if (Array.isArray(raw.images)) image = raw.images[0] || "";
          else image = raw.images;
        }

        console.log("Inserting item:", { product_id, product_name, price, qty, size, color });


        await connection.query(
          `INSERT INTO order_items
          (order_id,product_id,product_name,price,qty,size,color,image)
          VALUES (?,?,?,?,?,?,?,?)`,
          [
            data.order_id,
            product_id,
            product_name,
            price,
            qty,
            size,
            color,
            image
          ]
        );
      }
    }

    await connection.commit();
    console.log("Transaction committed successfully");

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order_id: data.order_id
    });

  } catch (err) {
    console.error("Order creation error:", err);
    await connection.rollback();
    res.status(500).json({ message: err.message || "Server error" });

  } finally {
    connection.release();
  }
}


async function generateOrderId(req, res) {
  try {

    const [rows] = await pool.query(
      "SELECT order_id FROM orders ORDER BY id DESC LIMIT 1"
    );

    let nextNumber = 1;

    if (rows.length > 0 && rows[0].order_id) {
      const lastOrderId = rows[0].order_id; // ORD001
      const number = parseInt(lastOrderId.replace("ORD", ""));
      nextNumber = number + 1;
    }

    const order_id = `ORD${String(nextNumber).padStart(3, "0")}`;

    res.json({ order_id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getAllOrders, getOrder, updateOrderStatus, createOrder, generateOrderId };
