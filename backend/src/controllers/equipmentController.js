const db = require('../config/db');

async function getAllEquipment(req, res) {
  try {
    const result = await db.query(
      'SELECT * FROM gym_equipment ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getAllEquipment error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function getEquipmentById(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    const result = await db.query(
      `SELECT * FROM gym_equipment WHERE id = $1`,
      [isNum ? idNum : id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('getEquipmentById error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function createEquipment(req, res) {
  try {
    const {
      name,
      category,
      purchaseDate,
      condition,
      status,
      serviceDueMonth,
      underWarranty,
      underMaintenance
    } = req.body;

    if (!name || !category || !purchaseDate) {
      return res.status(400).json({ message: "Name, category, and purchase date are required" });
    }

    const result = await db.query(
      `INSERT INTO gym_equipment 
       (name, category, purchase_date, condition, status, service_due_month, under_warranty, under_maintenance)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, category, purchaseDate, condition || 'Good', status || 'available', serviceDueMonth || null, underWarranty || false, underMaintenance || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createEquipment error', err);
    res.status(500).json({ error: 'Failed to create equipment' });
  }
}

async function updateEquipment(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    const {
      name,
      category,
      purchaseDate,
      condition,
      status,
      serviceDueMonth,
      underWarranty,
      underMaintenance
    } = req.body;

    const result = await db.query(
      `UPDATE gym_equipment 
       SET name = $1, category = $2, purchase_date = $3, condition = $4, 
           status = $5, service_due_month = $6, under_warranty = $7, 
           under_maintenance = $8, updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [name, category, purchaseDate, condition, status, serviceDueMonth, underWarranty, underMaintenance, isNum ? idNum : id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateEquipment error', err);
    res.status(500).json({ error: 'Failed to update equipment' });
  }
}

async function deleteEquipment(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);

    const result = await db.query(
      'DELETE FROM gym_equipment WHERE id = $1 RETURNING *',
      [isNum ? idNum : id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json({ message: 'Equipment deleted successfully' });
  } catch (err) {
    console.error('deleteEquipment error', err);
    res.status(500).json({ error: 'Failed to delete equipment' });
  }
}

async function getEquipmentByStatus(req, res) {
  try {
    const { status } = req.params;
    const result = await db.query(
      'SELECT * FROM gym_equipment WHERE status = $1 ORDER BY created_at DESC',
      [status]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getEquipmentByStatus error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

module.exports = {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipmentByStatus
};
