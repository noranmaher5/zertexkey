const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/codeController');

router.post('/bulk', protect, authorize('admin'), ctrl.addCodesBulk);
router.get('/stats', protect, authorize('admin'), ctrl.getCodeStats);
router.get('/product/:productId', protect, authorize('admin'), ctrl.getProductCodes);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteCode);

module.exports = router;
