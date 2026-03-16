const express = require('express');
const router = express.Router();
const { getDashboardStats, getTrainerDashboardStats, getWeeklyAttendance } = require('../controllers/dashboardController');

router.get('/stats', getDashboardStats);
router.get('/trainer-stats', getTrainerDashboardStats);
router.get('/weekly-attendance', getWeeklyAttendance);

module.exports = router;
