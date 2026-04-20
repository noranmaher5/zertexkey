const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/adminController'); 

// 1. حماية المسارات: الدخول للمشرفين فقط
router.use(protect, authorize('admin'));

// 2. إحصائيات لوحة التحكم
router.get('/dashboard', ctrl.getDashboardStats);

// 3. إدارة المستخدمين (الروابط المطلوبة)
router.get('/users', ctrl.getUsers);
// هذا السطر هو الذي كان ينقصك ويسبب خطأ 404 👇
router.put('/users/:id/role', ctrl.updateUserRole); 
router.put('/users/:id/toggle-status', ctrl.toggleUserStatus);
router.put('/users/:id/password', ctrl.changeUserPassword);

// 4. إعدادات النظام والتقارير
router.put('/settings', ctrl.updateSettings);
// داخل ملف adminRoutes.js
router.get('/logs', ctrl.getSystemLogs); // تأكدي من إضافة هذا السطر
router.get('/financials', ctrl.getFinancialReports);
router.delete('/users/:id', ctrl.deleteUser);

// 5.maintenance mode
router.put('/system/maintenance', ctrl.toggleMaintenanceMode);

module.exports = router;