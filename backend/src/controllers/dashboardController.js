const db = require('../config/db');
const dayjs = require('dayjs');

async function getDashboardStats(req, res) {
  try {
    const today = dayjs().format('YYYY-MM-DD');

    // Fetch multiple counts in parallel
    const [
      [membersCount],
      [activePlansCount],
      [pendingOrdersCount],
      [staffCount],
      [equipmentCount],
      [productsCount],
      [todayOrdersCount],
      [lowStockCount],
      [expiringCount],
      [todayMembersCount],
      [checkinsTodayCount]
    ] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM members'),
      db.query('SELECT COUNT(*) as count FROM plans WHERE active = 1'),
      db.query('SELECT COUNT(*) as count FROM orders WHERE status = "pending"'),
      db.query('SELECT COUNT(*) as count FROM staff WHERE status = "active"'),
      db.query('SELECT COUNT(*) as count FROM equipment'),
      db.query('SELECT COUNT(*) as count FROM products'),
      db.query('SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = ?', [today]),
      db.query('SELECT COUNT(*) as count FROM products WHERE JSON_EXTRACT(stock, "$.total") < 5'), // Simplified low stock
      db.query('SELECT COUNT(*) as count FROM memberships WHERE DATE(endDate) <= DATE_ADD(?, INTERVAL 7 DAY)', [today]),
      db.query('SELECT COUNT(*) as count FROM memberships WHERE DATE(startDate) = ?', [today]),
      db.query('SELECT COUNT(*) as count FROM attendance WHERE DATE(check_in) = ? OR `date` = ?', [today, today])
    ]);

    res.json({
      members: membersCount[0].count,
      activePlans: activePlansCount[0].count,
      pendingPayments: pendingOrdersCount[0].count,
      trainers: staffCount[0].count,
      equipmentDue: equipmentCount[0].count,
      totalOrders: 0,
      totalProducts: productsCount[0].count,
      newMembersToday: todayMembersCount[0].count,
      lowStockCount: lowStockCount[0].count,
      expiringCount: expiringCount[0].count,
      todayOrdersCount: todayOrdersCount[0].count,
      checkinsToday: checkinsTodayCount[0].count
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    res.status(500).json({ error: 'Failed' });
  }
}

async function getTrainerDashboardStats(req, res) {
  try {
    const { trainerUserId } = req.query;
    if (!trainerUserId) return res.status(400).json({ error: 'trainerUserId required' });

    // 1. Resolve staffId
    const [staffRows] = await db.query(
      'SELECT s.id FROM staff s JOIN users u ON (s.email = u.email OR s.username = u.username) WHERE u.id = ?',
      [trainerUserId]
    );
    if (staffRows.length === 0) return res.json({ members: 0, todayCheckins: 0, workoutPlans: 0, dietPlans: 0 });
    const staffId = staffRows[0].id;

    // 2. Fetch stats in parallel
    const [
      [membersCount],
      [checkinsCount],
      [workoutCount],
      [dietCount]
    ] = await Promise.all([
      db.query('SELECT COUNT(DISTINCT user_id) as count FROM trainer_assignments WHERE trainer_id = ? AND status = "active"', [staffId]),
      db.query('SELECT COUNT(*) as count FROM checkins WHERE trainer_id = ? AND DATE(check_in) = CURDATE()', [trainerUserId]), // Using checkins table
      db.query('SELECT COUNT(*) as count FROM workout_programs wp JOIN trainer_assignments ta ON ta.user_id = wp.member_id WHERE ta.trainer_id = ?', [staffId]),
      db.query('SELECT COUNT(*) as count FROM diet_plans dp JOIN trainer_assignments ta ON ta.user_id = dp.member_id WHERE ta.trainer_id = ?', [staffId])
    ]);

    res.json({
      members: membersCount[0].count,
      todayCheckins: checkinsCount[0].count,
      workoutPlans: workoutCount[0].count,
      dietPlans: dietCount[0].count
    });
  } catch (err) {
    console.error('getTrainerDashboardStats error:', err);
    res.status(500).json({ error: 'Failed' });
  }
}

async function getWeeklyAttendance(req, res) {
  try {
    const startDate = dayjs().subtract(6, 'day').format('YYYY-MM-DD');
    
    // Single query for the whole week
    const [rows] = await db.query(
      `SELECT 
        DATE(\`date\`) as date_only,
        status, 
        COUNT(*) as count 
       FROM attendance 
       WHERE (\`date\` >= ? OR DATE(check_in) >= ?)
       GROUP BY date_only, status`,
      [startDate, startDate]
    );

    const results = [];
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day');
      const dateStr = date.format('YYYY-MM-DD');
      
      const dayData = {
        day: date.format('ddd'),
        present: 0,
        absent: 0,
        late: 0,
        leave: 0
      };

      rows.forEach(r => {
        if (dayjs(r.date_only).isSame(date, 'day')) {
          const s = r.status.toLowerCase();
          if (s === 'present') dayData.present = r.count;
          else if (s === 'absent') dayData.absent = r.count;
          else if (s === 'late') dayData.late = r.count;
          else if (s.includes('leave')) dayData.leave = r.count;
        }
      });
      
      results.push(dayData);
    }
    res.json(results);
  } catch (err) {
    console.error('getWeeklyAttendance error:', err);
    res.status(500).json({ error: 'Failed' });
  }
}

module.exports = { getDashboardStats, getTrainerDashboardStats, getWeeklyAttendance };
