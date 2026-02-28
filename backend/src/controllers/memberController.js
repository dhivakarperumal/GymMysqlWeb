const db = require('../config/db');

async function getAllMembers(req, res) {
  try {
    const result = await db.query('SELECT * FROM gym_members ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('getAllMembers error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function getMemberById(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    const result = await db.query(
      `SELECT * FROM gym_members WHERE ${isNum ? 'id = $1' : 'member_id = $1'}`,
      [isNum ? idNum : id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('getMemberById error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function createMember(req, res) {
  const {
    name, phone, email, gender, height, weight, bmi,
    plan, duration, joinDate, expiryDate, status,
    photo, notes, address
  } = req.body;

  console.log('createMember received:', { name, phone, email, gender, height, weight, bmi, plan, duration, joinDate, expiryDate, status, photo: photo ? 'base64...' : null, notes, address });

  try {
    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }

    // duplicate phone check
    const existing = await db.query(
      "SELECT * FROM gym_members WHERE phone = $1",
      [phone]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Phone already exists" });
    }

    // generate member_id
    const count = await db.query("SELECT COUNT(*) FROM gym_members");
    const nextNumber = Number(count.rows[0].count) + 1;
    const memberId = `MB${String(nextNumber).padStart(3, "0")}`;

    // Parse numeric fields
    const numDuration = duration ? Number(duration) : null;

    const result = await db.query(
      `INSERT INTO gym_members
      (member_id, name, phone, email, gender, height, weight, bmi, plan, duration,
       join_date, expiry_date, status, photo, notes, address)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *`,
      [
        memberId, name, phone, email, gender, height, weight, bmi,
        plan, numDuration, joinDate, expiryDate, status, photo, notes, address
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error('createMember error:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

async function updateMember(req, res) {
  const { id } = req.params;
  const idNum = parseInt(id, 10);
  const isNum = !isNaN(idNum);
  
  const { name, phone, email, gender, height, weight, bmi,
          plan, duration, joinDate, expiryDate, status,
          photo, notes, address } = req.body;
  // ensure numeric values are correctly typed
  const numDuration = duration != null ? Number(duration) : null;

  try {
    // Check for duplicate phone if phone is being updated
    if (phone) {
      const existing = await db.query(
        `SELECT * FROM gym_members WHERE phone = $1 AND ${isNum ? 'id != $2' : 'member_id != $2'}`,
        [phone, isNum ? idNum : id]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: "Phone already exists" });
      }
    }

    const result = await db.query(
      `UPDATE gym_members SET
        name=$1, phone=$2, email=$3, gender=$4,
        height=$5, weight=$6, bmi=$7, plan=$8, duration=$9,
        join_date=$10, expiry_date=$11, status=$12,
        photo=$13, notes=$14, address=$15,
        updated_at=NOW()
       WHERE ${isNum ? 'id=$16' : 'member_id=$16'} RETURNING *`,
      [
        name, phone, email, gender, height, weight, bmi,
        plan, numDuration, joinDate, expiryDate, status,
        photo, notes, address, isNum ? idNum : id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error('updateMember error', err);
    res.status(500).json({ message: "Server error" });
  }
}

async function deleteMember(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    const result = await db.query(
      `DELETE FROM gym_members WHERE ${isNum ? 'id = $1' : 'member_id = $1'} RETURNING id`,
      [isNum ? idNum : id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ success: true, message: 'Member deleted successfully' });
  } catch (err) {
    console.error('deleteMember error', err);
    res.status(500).json({ error: 'Delete failed' });
  }
}

module.exports = { getAllMembers, getMemberById, createMember, updateMember, deleteMember };