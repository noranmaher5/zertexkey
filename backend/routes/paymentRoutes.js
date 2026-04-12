const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/paymentController');

router.get('/config', ctrl.getConfig);
router.post('/create-payment-intent', protect, ctrl.createPaymentIntent);
router.post('/confirm/:orderId', protect, ctrl.confirmPayment);
router.post('/webhook', ctrl.stripeWebhook); // raw body applied in server.js

module.exports = router;
