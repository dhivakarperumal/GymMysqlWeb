const db = require('../config/db');

// Stub: return attendance for a given date (currently returns empty)
async function getAttendance(req, res) {
  try {
    const { date } = req.query;
    // TODO: implement actual attendance lookup once schema is ready
    res.json([]);
  } catch (err) {
    console.error('getAttendance error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

module.exports = { getAttendance };
