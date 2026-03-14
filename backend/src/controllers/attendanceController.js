const db = require('../config/db');

/**
 * GET /api/attendance?date=YYYY-MM-DD
 * Returns all attendance records for a specific date.
 */
async function getAttendance(req, res) {
  try {
    const { date } = req.query;
    
    let sql = "SELECT * FROM attendance";
    let params = [];
    
    if (date) {
      sql += " WHERE DATE(check_in) = ?";
      params = [date];
    }
    
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('getAttendance error:', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

module.exports = { 
  getAttendance 
};
