const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/dashboard', ctrl.getDashboardStats);
router.get('/users', ctrl.getUsers);
router.put('/users/:id/role', authorize('manager'), ctrl.updateUserRole);
router.put('/users/:id/toggle-status', authorize('manager'), ctrl.toggleUserStatus);

module.exports = router;
