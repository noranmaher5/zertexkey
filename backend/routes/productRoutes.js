const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/productController');

router.get('/', ctrl.getProducts);
router.get('/categories/stats', ctrl.getCategoryStats);
router.get('/:id', ctrl.getProduct);

router.post('/', protect, authorize('editor'), ctrl.createProduct);
router.put('/:id', protect, authorize('editor'), ctrl.updateProduct);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteProduct);
router.post('/:id/reviews', protect, ctrl.addReview);

module.exports = router;
