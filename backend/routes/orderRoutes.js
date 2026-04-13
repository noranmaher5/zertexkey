const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/orderController');

router.get('/my', protect, ctrl.getMyOrders);
router.get('/', protect, authorize('admin'), ctrl.getAllOrders);
router.get('/:id', protect, ctrl.getOrder);
router.put('/:id/status', protect, authorize('admin'), ctrl.updateOrderStatus);
router.post('/:id/confirm-and-send', protect, authorize('admin'), ctrl.confirmAndSend); // ← أضفه هنا

module.exports = router;