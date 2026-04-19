const Order       = require('../models/Order');
const Product     = require('../models/Product');
const DigitalCode = require('../models/DigitalCode');
const crypto      = require('crypto');
const emailService = require('../services/emailService');
const Notification = require('../models/Notification'); // استدعاء موديل الإشعارات

exports.getConfig = async (req, res) => {
  res.json({ success: true, publishableKey: 'fake_key', fakeMode: true });
};

// ── Create Payment Intent (ينشئ الأوردر مباشرة بـ paid_unconfirmed) ──
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { items, method } = req.body;

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

    const finalAmount = Math.round(totalAmount * 100) / 100;

    // Idempotency: avoid duplicate orders for same cart within a short window
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
      status: 'paid_unconfirmed',   // was pending
      createdAt: { $gte: recentCutoff }
    }).sort({ createdAt: -1 });

    if (existing) {
      return res.json({
        success: true,
        clientSecret: 'fake_' + existing._id,
        orderId: existing._id,
        totalAmount: existing.totalAmount,
        fakeMode: true,
        reused: true
      });
    }

    // Create new order
    const paymentMethod = method === 'paypal' ? 'paypal' : 'stripe';

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount: finalAmount,
      status: 'paid_unconfirmed',   // was pending
      paymentMethod,
      checkoutHash
    });

    res.json({
      success: true,
      clientSecret: 'fake_' + order._id,
      orderId: order._id,
      totalAmount: finalAmount,
      fakeMode: true
    });

    // تنبيه الأدمن بالأوردر الجديد (سايلنت فايل لا يوقف الدفع)
    emailService.sendAdminNewOrderAlert(order, req.user).catch(() => {});

  } catch (err) {
    next(err);
  }
};

// ── Confirm Payment (دلوقتي مش بينشئ أوردر، بس بيتأكد) ──
exports.confirmPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // لو الأوردر خلاص في الحالة الصحيحة
    if (['paid_unconfirmed', 'pending', 'processing', 'failed', 'completed'].includes(order.status)) {
      return res.json({
        success: true,
        order,
        alreadyProcessed: true
      });
    }

    // لو كان في حالة تانية
    if (!['paid_unconfirmed', 'pending', 'processing', 'failed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order not ready for confirmation' });
    }

    order.status = 'completed';
    await order.save();

    res.json({
      success: true,
      order
    });

  } catch (err) {
    next(err);
  }
};

exports.stripeWebhook = async (req, res) => {
  res.json({ received: true });
};


