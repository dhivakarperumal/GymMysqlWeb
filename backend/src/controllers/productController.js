const db = require('../config/db');

async function createProduct(req, res) {
  try {
    const {
      name, category, subcategory, description, ratings,
      weight, size, gender, mrp, offer, offerPrice, stock, images
    } = req.body;

    const result = await db.query(
      `INSERT INTO products
      (name, category, subcategory, description, ratings, weight, size, gender,
       mrp, offer, offer_price, stock, images)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        name, category, subcategory, description, ratings,
        weight, size, gender, mrp, offer, offerPrice, stock, images
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('createProduct error', err);
    res.status(500).json({ error: 'Insert failed' });
  }
}

async function listProducts(req, res) {
  try {
    const result = await db.query('SELECT * FROM products ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('listProducts error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function getProduct(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    const result = await db.query('SELECT * FROM products WHERE id = $1', [isNum ? idNum : id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('getProduct error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    await db.query('DELETE FROM products WHERE id = $1', [isNum ? idNum : id]);
    res.json({ success: true });
  } catch (err) {
    console.error('deleteProduct error', err);
    res.status(500).json({ error: 'Delete failed' });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    const data = req.body;
    // simple partial update, using jsonb for stock requires conversion if array
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key in data) {
      fields.push(`${key} = $${idx}`);
      values.push(data[key]);
      idx++;
    }
    if (!fields.length) return res.status(400).json({ error: 'No data' });
    values.push(isNum ? idNum : id);
    const query = `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await db.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateProduct error', err);
    res.status(500).json({ error: 'Update failed' });
  }
}

module.exports = { createProduct, listProducts, getProduct, deleteProduct, updateProduct };
