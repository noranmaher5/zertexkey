const express = require('express');
const router = express.Router();
const { protect, authorize, checkPermission } = require('../middleware/auth');
const ctrl = require('../controllers/productController');
const upload = require('../middleware/upload');

router.get('/', ctrl.getProducts);
router.get('/categories/stats', ctrl.getCategoryStats);
router.get('/:id', ctrl.getProduct);

// إنشاء منتج جديد مع صورة
router.post('/', protect, checkPermission('manage_products'), upload.single('image'), ctrl.createProduct);

// تحديث منتج مع صورة
router.put('/:id', protect, checkPermission('manage_products'), upload.single('image'), ctrl.updateProduct);

// حذف منتج
router.delete('/:id', protect, checkPermission('manage_products'), ctrl.deleteProduct);

// إضافة تقييم - للمشترين فقط
router.post('/:id/reviews', protect, ctrl.addReview);

// حذف تقييم - للأدمنز فقط
router.delete('/:productId/reviews/:reviewId', protect, checkPermission('manage_products'), ctrl.deleteReview);

module.exports = router;