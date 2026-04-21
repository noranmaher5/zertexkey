const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/notificationController');

router.get('/', protect, ctrl.getNotifications);
router.put('/mark-all-read', protect, ctrl.markAllAsRead);
router.put('/:id/read', protect, ctrl.markAsRead);
router.delete('/clear-all', protect, ctrl.clearAll);
router.delete('/:id', protect, ctrl.deleteNotification);

module.exports = router;