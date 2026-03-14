const express = require('express');
const { getAttendance, markAttendance, reverseGeocode } = require('../controllers/attendanceController');

const router = express.Router();

router.get('/', getAttendance);
router.post('/', markAttendance);
router.get('/reverse-geocode', reverseGeocode);

module.exports = router;
