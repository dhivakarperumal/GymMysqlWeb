const db = require('../config/db');

async function generateEmployeeId(req, res) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const select = await client.query("SELECT current FROM counters WHERE name = 'employees' FOR UPDATE");
    if (select.rows.length === 0) {
      await client.query("INSERT INTO counters(name, current) VALUES ('employees', 1)");
      await client.query('COMMIT');
      return res.json({ employeeId: `EMP${String(1).padStart(3, '0')}` });
    }

    const current = select.rows[0].current || 0;
    const next = current + 1;
    await client.query('UPDATE counters SET current = $1 WHERE name = $2', [next, 'employees']);
    await client.query('COMMIT');
    return res.json({ employeeId: `EMP${String(next).padStart(3, '0')}` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('generateEmployeeId error', err);
    res.status(500).json({ error: 'Failed to generate employee id' });
  } finally {
    client.release();
  }
}

async function getStaffById(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    const result = await db.query(
      `SELECT * FROM staff WHERE ${isNum ? 'id = $1' : 'employee_id = $1'}`,
      [isNum ? idNum : id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Staff not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('getStaffById error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function createStaff(req, res) {
  try {
    const body = req.body;

    const query = `INSERT INTO staff
      (employee_id, username, name, email, phone, role, department, gender, blood_group,
       dob, joining_date, qualification, experience, shift, salary, address,
       emergency_name, emergency_phone, status, time_in, time_out,
       photo, aadhar_doc, id_doc, certificate_doc, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
      RETURNING *`;

    const params = [
      body.employee_id || null,
      body.username || null,
      body.name || null,
      body.email || null,
      body.phone || null,
      body.role || null,
      body.department || null,
      body.gender || null,
      body.blood_group || null,
      body.dob || null,
      body.joining_date || null,
      body.qualification || null,
      body.experience || null,
      body.shift || null,
      body.salary || null,
      body.address || null,
      body.emergency_name || null,
      body.emergency_phone || null,
      body.status || 'active',
      body.time_in || null,
      body.time_out || null,
      body.photo || null,
      body.aadhar_doc || null,
      body.id_doc || null,
      body.certificate_doc || null,
      new Date(),
      new Date(),
    ];

    const result = await db.query(query, params);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createStaff error', err);
    res.status(500).json({ error: 'Failed to create staff' });
  }
}

async function updateStaff(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    const body = req.body;

    const query = `UPDATE staff SET
      employee_id = $1, username = $2, name = $3, email = $4, phone = $5, role = $6,
      department = $7, gender = $8, blood_group = $9, dob = $10, joining_date = $11,
      qualification = $12, experience = $13, shift = $14, salary = $15, address = $16,
      emergency_name = $17, emergency_phone = $18, status = $19, time_in = $20, time_out = $21,
      photo = $22, aadhar_doc = $23, id_doc = $24, certificate_doc = $25, updated_at = NOW()
      WHERE ${isNum ? 'id = $26' : 'employee_id = $26'} RETURNING *`;

    const params = [
      body.employee_id || null,
      body.username || null,
      body.name || null,
      body.email || null,
      body.phone || null,
      body.role || null,
      body.department || null,
      body.gender || null,
      body.blood_group || null,
      body.dob || null,
      body.joining_date || null,
      body.qualification || null,
      body.experience || null,
      body.shift || null,
      body.salary || null,
      body.address || null,
      body.emergency_name || null,
      body.emergency_phone || null,
      body.status || 'active',
      body.time_in || null,
      body.time_out || null,
      body.photo || null,
      body.aadhar_doc || null,
      body.id_doc || null,
      body.certificate_doc || null,
      isNum ? idNum : id,
    ];

    const result = await db.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Staff not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateStaff error', err);
    res.status(500).json({ error: 'Failed to update staff' });
  }
}

async function getAllStaff(req, res) {
  try {
    const result = await db.query('SELECT * FROM staff ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('getAllStaff error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function deleteStaff(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    const result = await db.query(
      `DELETE FROM staff WHERE ${isNum ? 'id = $1' : 'employee_id = $1'} RETURNING *`,
      [isNum ? idNum : id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Staff not found' });
    res.json({ message: 'Staff deleted' });
  } catch (err) {
    console.error('deleteStaff error', err);
    res.status(500).json({ error: 'Delete failed' });
  }
}

module.exports = {
  generateEmployeeId,
  getStaffById,
  createStaff,
  updateStaff,
  getAllStaff,
  deleteStaff,
};
