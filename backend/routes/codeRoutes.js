const express = require('express');
const router = express.Router();
const { protect, authorize, checkPermission } = require('../middleware/auth');
const ctrl = require('../controllers/codeController');

router.post('/bulk', protect, checkPermission('manage_products'), ctrl.addCodesBulk);
router.get('/stats', protect, checkPermission('manage_products'), ctrl.getCodeStats);
router.get('/product/:productId', protect, checkPermission('manage_products'), ctrl.getProductCodes);
router.delete('/:id', protect, checkPermission('manage_products'), ctrl.deleteCode);

module.exports = router;
