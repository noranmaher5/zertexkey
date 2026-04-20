const paypal = require('@paypal/checkout-server-sdk');
const Order = require('../models/Order');
const Product = require('../models/Product');
const DigitalCode = require('../models/DigitalCode');
const DiscountCode = require('../models/DiscountCode');
const Notification = require('../models/Notification');
const emailService = require('../services/emailService');
const crypto = require('crypto');

const client = () => {
  const environment = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  );
  return new paypal.core.PayPalHttpClient(environment);
};

// ── 1. ننشئ PayPal Order بس — من غير ما نلمس الداتابيز ──
exports.createPayPalOrder = async (req, res) => {
  try {
    const { amount } = req.body; // مش محتاجين orderId هنا خالص

    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'USD', value: Number(amount).toFixed(2) },
      }]
    });

    const order = await client().execute(request);
    res.json({ success: true, paypalOrderId: order.result.id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── 2. بعد ما اليوزر يدفع — ننشئ الأوردر في الداتابيز ونعمل Capture ──
exports.capturePayPalOrder = async (req, res) => {
  try {
    const { paypalOrderId, items, discountCode } = req.body;

    // أولاً: نعمل Capture على PayPal
    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    const capture = await client().execute(request);

    if (capture.result.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Payment not completed' });
    }

    // ثانياً: بعد تأكيد الدفع — ننشئ الأوردر في الداتابيز
    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'No items provided' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: `Product not found: ${item.productId}` });
      }

      if (!product.isUnlimited) {
        const available = await DigitalCode.countDocuments({
          product: product._id,
          isUsed: false
        });
        if (available < item.quantity) {
          return res.status(400).json({ success: false, message: `Out of stock: ${product.name}` });
        }
      }

      totalAmount += product.price * item.quantity;
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: item.quantity,
        codes: []
      });
    }

    let finalAmount = Math.round(totalAmount * 100) / 100;
    let appliedDiscount = null;

    // تطبيق كود الخصم لو موجود
    if (discountCode) {
      const discount = await DiscountCode.findOne({
        code: discountCode.toUpperCase(),
        isActive: true
      });
      if (discount) {
        const userUsageCount = discount.usedBy.filter(
          u => u.user.toString() === req.user.id
        ).length;
        const notMaxed = discount.maxUses === 0 || discount.usedCount < discount.maxUses;
        const notExpired = !discount.expiresAt || new Date() < discount.expiresAt;
        const userNotMaxed = userUsageCount < discount.maxUsesPerUser;

        if (notMaxed && notExpired && userNotMaxed) {
          let discountAmount = 0;
          if (discount.type === 'percentage') {
            discountAmount = (finalAmount * discount.value) / 100;
          } else {
            discountAmount = Math.min(discount.value, finalAmount);
          }
          finalAmount = Math.max(0, Math.round((finalAmount - discountAmount) * 100) / 100);
          appliedDiscount = { id: discount._id, amount: discountAmount };
        }
      }
    }

    // Idempotency — نتجنب أوردر مكرر لو في مشكلة
    const signature = orderItems
      .map(i => `${i.product.toString()}:${i.quantity}:${i.price}`)
      .sort()
      .join('|');
    const checkoutHash = crypto
      .createHash('sha256')
      .update(`${req.user.id}|${finalAmount}|${signature}`)
      .digest('hex');

    const recentCutoff = new Date(Date.now() - 10 * 60 * 1000);
    const existing = await Order.findOne({
      user: req.user.id,
      checkoutHash,
      status: { $in: ['paid_unconfirmed', 'completed'] },
      createdAt: { $gte: recentCutoff }
    });

    if (existing) {
      return res.json({ success: true, orderId: existing._id, reused: true });
    }

    // ننشئ الأوردر — بعد الدفع مباشرة
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount: finalAmount,
      status: 'paid_unconfirmed',
      paymentMethod: 'paypal',
      checkoutHash,
      paypalOrderId: paypalOrderId, // نحفظ PayPal ID للمرجعية
    });

    // سجّل استخدام كود الخصم
    if (appliedDiscount) {
      await DiscountCode.findByIdAndUpdate(appliedDiscount.id, {
        $inc: { usedCount: 1 },
        $push: {
          usedBy: {
            user: req.user.id,
            order: order._id,
            usedAt: new Date(),
            discountAmount: appliedDiscount.amount,
          }
        }
      });
    }

    // إشعار لليوزر
    try {
      await Notification.create({
        user: req.user.id,
        type: 'codes_ready',
        title: 'Order Confirmed! 🎉',
        message: `Your order #${order._id.toString().slice(-6)} has been completed successfully.`,
        actionUrl: `/orders/${order._id}`,
        metadata: { orderId: order._id }
      });
    } catch (e) {
      console.error('❌ Notification failed:', e);
    }

    // إيميل للأدمن
    emailService.sendAdminNewOrderAlert(order, req.user).catch(() => {});

    res.json({ success: true, orderId: order._id });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};