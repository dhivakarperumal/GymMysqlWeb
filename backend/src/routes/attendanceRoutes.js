const express = require('express');
const { getAttendance } = require('../controllers/attendanceController');

const router = express.Router();

router.get('/', getAttendance);

module.exports = router;
