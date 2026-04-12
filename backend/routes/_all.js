// ─── Order Routes ─────────────────────────────────────────────────────────────
const express = require('express');

const orderRouter = express.Router();
const { protect, authorize } = require('../middleware/auth');
const orderCtrl = require('../controllers/orderController');

orderRouter.get('/my', protect, orderCtrl.getMyOrders);
orderRouter.get('/', protect, authorize('admin'), orderCtrl.getAllOrders);
orderRouter.get('/:id', protect, orderCtrl.getOrder);
orderRouter.put('/:id/status', protect, authorize('admin'), orderCtrl.updateOrderStatus);

// ─── Code Routes ──────────────────────────────────────────────────────────────
const codeRouter = express.Router();
const codeCtrl = require('../controllers/codeController');

codeRouter.post('/bulk', protect, authorize('admin'), codeCtrl.addCodesBulk);
codeRouter.get('/stats', protect, authorize('admin'), codeCtrl.getCodeStats);
codeRouter.get('/product/:productId', protect, authorize('admin'), codeCtrl.getProductCodes);
codeRouter.delete('/:id', protect, authorize('admin'), codeCtrl.deleteCode);

// ─── Payment Routes ───────────────────────────────────────────────────────────
const paymentRouter = express.Router();
const paymentCtrl = require('../controllers/paymentController');

paymentRouter.get('/config', paymentCtrl.getConfig);
paymentRouter.post('/create-payment-intent', protect, paymentCtrl.createPaymentIntent);
paymentRouter.post('/confirm/:orderId', protect, paymentCtrl.confirmPayment);
paymentRouter.post('/webhook', paymentCtrl.stripeWebhook);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
const adminRouter = express.Router();
const adminCtrl = require('../controllers/adminController');

adminRouter.use(protect, authorize('admin'));
adminRouter.get('/dashboard', adminCtrl.getDashboardStats);
adminRouter.get('/users', adminCtrl.getUsers);
adminRouter.put('/users/:id/role', authorize('manager'), adminCtrl.updateUserRole);
adminRouter.put('/users/:id/toggle-status', authorize('manager'), adminCtrl.toggleUserStatus);

// ─── User Routes ──────────────────────────────────────────────────────────────
const userRouter = express.Router();
userRouter.use(protect);
userRouter.get('/me', require('../controllers/authController').getMe);

module.exports = { orderRouter, codeRouter, paymentRouter, adminRouter, userRouter };
