const db = require('../config/db');

// Helper function to parse JSON fields
const parseProduct = (product) => {
  if (!product) return product;
  return {
    ...product,
    weight: typeof product.weight === 'string' ? JSON.parse(product.weight || '[]') : (product.weight || []),
    size: typeof product.size === 'string' ? JSON.parse(product.size || '[]') : (product.size || []),
    gender: typeof product.gender === 'string' ? JSON.parse(product.gender || '[]') : (product.gender || []),
    images: typeof product.images === 'string' ? JSON.parse(product.images || '[]') : (product.images || []),
    stock: typeof product.stock === 'string' ? JSON.parse(product.stock || '{}') : (product.stock || {})
  };
};

async function createProduct(req, res) {
  try {
    const {
      name, category, subcategory, description, ratings,
      weight, size, gender, mrp, offer, offerPrice, stock, images
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO products
      (name, category, subcategory, description, ratings, weight, size, gender,
       mrp, offer, offer_price, stock, images)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        name, category, subcategory, description, ratings,
        JSON.stringify(weight || []), JSON.stringify(size || []), JSON.stringify(gender || []), 
        mrp, offer, offerPrice, JSON.stringify(stock || {}), JSON.stringify(images || [])
      ]
    );

    // Fetch the created product
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.json(parseProduct(rows[0]));
  } catch (err) {
    console.error('createProduct error', err);
    res.status(500).json({ error: 'Insert failed' });
  }
}

async function listProducts(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM products ORDER BY id DESC');
    res.json(rows.map(parseProduct));
  } catch (err) {
    console.error('listProducts error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function getProduct(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [idNum]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(parseProduct(rows[0]));
  } catch (err) {
    console.error('getProduct error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    
    await db.query('DELETE FROM products WHERE id = ?', [idNum]);
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
    
    const data = req.body;
    const fields = [];
    const values = [];
    
    for (const key in data) {
      // For JSON fields, stringify them
      if (['weight', 'size', 'gender', 'images', 'stock'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(JSON.stringify(data[key] || {}));
      } else {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    
    if (!fields.length) return res.status(400).json({ error: 'No data' });
    
    values.push(idNum);
    const query = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.query(query, values);
    
    // Fetch the updated product
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [idNum]);
    res.json(parseProduct(rows[0]));
  } catch (err) {
    console.error('updateProduct error', err);
    res.status(500).json({ error: 'Update failed' });
  }
}

module.exports = { createProduct, listProducts, getProduct, deleteProduct, updateProduct };
