const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrder,
  updateOrderStatus,
  createOrder,
} = require('../controllers/orderController');

router.get('/', getAllOrders);
router.get('/:id', getOrder);
router.post('/', createOrder);
router.patch('/:id/status', updateOrderStatus);

module.exports = router;
