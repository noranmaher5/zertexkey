const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/discountController');

// User routes
router.post('/validate', protect, ctrl.validateCode);

// Admin routes
router.get('/', protect, authorize('admin'), ctrl.getAllCodes);
router.post('/', protect, authorize('admin'), ctrl.createCode);
router.put('/:id/toggle', protect, authorize('admin'), ctrl.toggleCode);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteCode);

module.exports = router;