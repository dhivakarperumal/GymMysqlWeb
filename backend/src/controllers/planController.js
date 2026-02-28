const db = require('../config/db');

async function getAllPlans(req, res) {
  try {
    const result = await db.query('SELECT * FROM gym_plans ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('getAllPlans error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function getPlanById(req, res) {
  try {
    const { id } = req.params;
    
    // Try to parse as integer, otherwise use as string
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    const result = await db.query(
      `SELECT * FROM gym_plans WHERE ${isNum ? 'id = $1' : 'plan_id = $1 OR id::text = $1'}`,
      [isNum ? idNum : id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('getPlanById error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function createPlan(req, res) {
  const {
    name, description, duration, price, discount, finalPrice,
    facilities, trainerIncluded, dietPlans, active
  } = req.body;

  console.log('createPlan received:', {
    name, description, duration, price, discount, finalPrice,
    facilities: facilities?.length || 0, trainerIncluded, dietPlans: dietPlans?.length || 0, active
  });

  try {
    // Validate required fields
    if (!name || !duration || !price) {
      return res.status(400).json({ message: "Name, duration, and price are required" });
    }

    // generate plan_id
    const count = await db.query("SELECT COUNT(*) FROM gym_plans");
    const nextNumber = Number(count.rows[0].count) + 1;
    const planId = `PL${String(nextNumber).padStart(3, "0")}`;

    const result = await db.query(
      `INSERT INTO gym_plans
      (plan_id, name, description, duration, price, discount, final_price, 
       facilities, trainer_included, diet_plans, active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [
        planId, name, description, duration, Number(price), Number(discount),
        Number(finalPrice), JSON.stringify(facilities || []), trainerIncluded || false,
        JSON.stringify(dietPlans || []), active !== false
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error('createPlan error:', err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

async function updatePlan(req, res) {
  const { id } = req.params;
  const {
    name, description, duration, price, discount, finalPrice,
    facilities, trainerIncluded, dietPlans, active
  } = req.body;

  try {
    // Try to parse as integer, otherwise use as string
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    const result = await db.query(
      `UPDATE gym_plans SET
        name=$1, description=$2, duration=$3, price=$4, discount=$5,
        final_price=$6, facilities=$7, trainer_included=$8, diet_plans=$9,
        active=$10, updated_at=NOW()
       WHERE ${isNum ? 'id=$11' : 'plan_id=$11'} RETURNING *`,
      [
        name, description, duration, Number(price), Number(discount),
        Number(finalPrice), JSON.stringify(facilities || []), trainerIncluded || false,
        JSON.stringify(dietPlans || []), active !== false, isNum ? idNum : id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error('updatePlan error', err);
    res.status(500).json({ message: "Server error" });
  }
}

async function deletePlan(req, res) {
  try {
    const { id } = req.params;
    
    // Try to parse as integer, otherwise use as string
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    const result = await db.query(
      `DELETE FROM gym_plans WHERE ${isNum ? 'id = $1' : 'plan_id = $1'} RETURNING id`,
      [isNum ? idNum : id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.json({ success: true, message: 'Plan deleted successfully' });
  } catch (err) {
    console.error('deletePlan error', err);
    res.status(500).json({ error: 'Delete failed' });
  }
}

module.exports = { getAllPlans, getPlanById, createPlan, updatePlan, deletePlan };
