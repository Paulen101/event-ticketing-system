const express = require('express');
const { getDashboard, getDashboardEvents, getAnalytics } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.get('/dashboard', protect, admin, getDashboard);
router.get('/dashboard/events', protect, admin, getDashboardEvents);
router.get('/analytics', protect, admin, getAnalytics);

module.exports = router;
