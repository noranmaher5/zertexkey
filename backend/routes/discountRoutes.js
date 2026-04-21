const express = require('express');
const router = express.Router();
const { protect, authorize, checkPermission } = require('../middleware/auth');
const ctrl = require('../controllers/discountController');

// User routes
router.post('/validate', protect, ctrl.validateCode);

// Admin routes
router.get('/', protect, checkPermission('manage_settings'), ctrl.getAllCodes);
router.post('/', protect, checkPermission('manage_settings'), ctrl.createCode);
router.put('/:id/toggle', protect, checkPermission('manage_settings'), ctrl.toggleCode);
router.delete('/:id', protect, checkPermission('manage_settings'), ctrl.deleteCode);

module.exports = router;