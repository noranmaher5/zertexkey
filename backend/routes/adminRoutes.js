const express = require('express');
const router = express.Router();
const { protect, authorize, checkPermission } = require('../middleware/auth');
const ctrl = require('../controllers/adminController'); 

// 1. حماية المسارات: الدخول للمشرفين فقط
router.use(protect, authorize('admin'));

// 2. إحصائيات لوحة التحكم
router.get('/dashboard', ctrl.getDashboardStats);

// 3. إدارة المستخدمين (الروابط المطلوبة)
router.get('/users', checkPermission('manage_users'), ctrl.getUsers);
//4. تحديث دور المستخدم، تفعيل/تعطيل الحساب، تغيير كلمة المرو
router.put('/users/:id/role', checkPermission('manage_users'), ctrl.updateUserRole); 
//5. تفعيل أو تعطيل حساب مستخدم
router.put('/users/:id/toggle-status', checkPermission('manage_users'), ctrl.toggleUserStatus);
//6. تغيير كلمة المرورللمستخدم (أدمن فقط)
router.put('/users/:id/password', checkPermission('manage_users'), ctrl.changeUserPassword);

// 7. إعدادات النظام والتقارير
router.put('/settings', checkPermission('manage_settings'), ctrl.updateSettings);
//8. جلب التقارير المالية المفصلة
router.get('/logs', checkPermission('view_ledger'), ctrl.getSystemLogs); 
//9. جلب التقارير المالية الشاملة
router.get('/financials', checkPermission('view_analytics'), ctrl.getFinancialReports);
//10. حذف مستخدم
router.delete('/users/:id', checkPermission('manage_users'), ctrl.deleteUser);

// 11. maintenance mode
router.put('/system/maintenance', checkPermission('manage_maintenance'), ctrl.toggleMaintenanceMode);

module.exports = router;