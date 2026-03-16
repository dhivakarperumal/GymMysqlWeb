const db = require('../config/db');

/**
 * GET /api/attendance?date=YYYY-MM-DD&trainerId=...
 * Returns all attendance records for a specific date.
 */
async function getAttendance(req, res) {
  try {
    const { date, trainerId } = req.query;

    // Improved query to get names from either users or staff
    let sql = `
      SELECT 
        a.*, 
        COALESCE(s.name, u.username, u.email, 'Unknown') as name, 
        COALESCE(u.email, s.email) as email,
        COALESCE(s.role, u.role, 'Staff') as role
      FROM attendance a
      LEFT JOIN users u ON u.id = a.member_id
      LEFT JOIN staff s ON (s.email = u.email OR s.username = u.username OR s.id = a.member_id)
      WHERE 1=1
    `;
    let params = [];

    if (date) {
      sql += " AND (a.`date` = ? OR DATE(a.check_in) = ?)";
      params.push(date, date);
    } else if (req.query.startDate && req.query.endDate) {
      sql += " AND (a.`date` BETWEEN ? AND ? OR DATE(a.check_in) BETWEEN ? AND ?)";
      params.push(req.query.startDate, req.query.endDate, req.query.startDate, req.query.endDate);
    }

    if (trainerId) {
      // Resolve trainerUserId (users.id) to staffId (staff.id)
      const [staffRows] = await db.query(
        "SELECT s.id FROM staff s JOIN users u ON (s.email = u.email OR s.username = u.username) WHERE u.id = ?",
        [trainerId]
      );
      const resolvedStaffId = staffRows.length > 0 ? staffRows[0].id : null;

      sql += " AND a.trainer_id = ?";
      params.push(resolvedStaffId);
    }

    sql += " GROUP BY a.id ORDER BY a.check_in DESC";

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('getAttendance error:', err);
    res.status(500).json({ error: 'Query failed', details: err.message });
  }
}

/**
 * GET /api/attendance/reverse-geocode?lat=...&lng=...
 * Proxies to Nominatim to avoid CSP issues on frontend.
 */
async function reverseGeocode(req, res) {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'Lat and Lng required' });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'GymManagementApp/1.0' // Nominatim requires a User-Agent
        }
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('reverseGeocode error:', err);
    res.status(500).json({ error: 'Failed to fetch address' });
  }
}

/**
 * POST /api/attendance
 * Marks attendance for a member by a trainer.
 */
async function markAttendance(req, res) {
  try {
    const { memberId, trainerId, status, date, lat, lng, locationName } = req.body;

    if (!memberId || !status || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Resolve trainerUserId (users.id) to staffId (staff.id)
    let resolvedStaffId = null;
    if (trainerId) {
      const [staffRows] = await db.query(
        "SELECT s.id FROM staff s JOIN users u ON (s.email = u.email OR s.username = u.username) WHERE u.id = ?",
        [trainerId]
      );
      resolvedStaffId = staffRows.length > 0 ? staffRows[0].id : null;
    }

    // Check if record already exists for this member and date
    const [existing] = await db.query(
      "SELECT id FROM attendance WHERE member_id = ? AND (`date` = ? OR DATE(check_in) = ?)",
      [memberId, date, date]
    );

    if (existing.length > 0) {
      // Update existing record
      await db.query(
        "UPDATE attendance SET status = ?, trainer_id = ?, lat = ?, lng = ?, location_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [status, resolvedStaffId || null, lat || null, lng || null, locationName || null, existing[0].id]
      );
      return res.json({ success: true, message: 'Attendance updated' });
    }

    // Insert new record
    await db.query(
      "INSERT INTO attendance (member_id, trainer_id, status, `date`, lat, lng, location_name, check_in) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
      [memberId, resolvedStaffId || null, status, date, lat || null, lng || null, locationName || null]
    );

    res.json({ success: true, message: 'Attendance marked' });
  } catch (err) {
    console.error('markAttendance error:', err);
    res.status(500).json({ error: 'Failed to mark attendance', details: err.message });
  }
}

module.exports = {
  getAttendance,
  markAttendance,
  reverseGeocode
};
