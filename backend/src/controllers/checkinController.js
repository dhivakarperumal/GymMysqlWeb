const db = require('../config/db');

/**
 * GET /api/checkins/today?trainerId=...
 * Returns the count of check-ins for the current day.
 * If trainerId is provided, filters by members assigned to that trainer.
 */
async function getTodayCheckins(req, res) {
  try {
    const { trainerId } = req.query;
    
    // We'll count members who have an entry in the attendance table for today.
    // If trainerId is provided, we join with trainer_assignments to filter.
    
    let sql = "";
    let params = [];
    
    if (trainerId) {
      sql = `
        SELECT COUNT(DISTINCT a.member_id) as count
        FROM attendance a
        INNER JOIN trainer_assignments ta ON (ta.user_id = a.member_id OR ta.user_id = (SELECT user_id FROM members WHERE id = a.member_id))
        WHERE DATE(a.check_in) = CURDATE()
          AND ta.trainer_id = ?
      `;
      params = [trainerId];
    } else {
      sql = `
        SELECT COUNT(DISTINCT member_id) as count
        FROM attendance
        WHERE DATE(check_in) = CURDATE()
      `;
    }
    
    const [rows] = await db.query(sql, params);
    res.json({ count: rows[0].count || 0 });
  } catch (err) {
    console.error('getTodayCheckins error:', err);
    res.status(500).json({ error: 'Failed to fetch today\'s check-ins' });
  }
}

module.exports = {
  getTodayCheckins
};
