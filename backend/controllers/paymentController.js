const Order = require('../models/Order');
const Product = require('../models/Product');
const DigitalCode = require('../models/DigitalCode');

// ❌ شيلنا fulfillOrder من هنا
// const { fulfillOrder } = require('./orderController');

exports.getConfig = async (req, res) => {
  res.json({ success: true, publishableKey: 'fake_key', fakeMode: true });
};

exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'No items'
      });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Product not found'
        });
      }

      const available = await DigitalCode.countDocuments({
        product: product._id,
        isUsed: false
      });

      if (available < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Out of stock: ${product.name}`
        });
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

    // ✅ منع تكرار الأوردر
    const recentOrder = await Order.findOne({
      user: req.user.id,
      status: 'pending',
      totalAmount: finalAmount,
      createdAt: {
        $gte: new Date(Date.now() - 5 * 60 * 1000)
      }
    });

    if (recentOrder) {
      return res.json({
        success: true,
        clientSecret: 'fake_' + recentOrder._id,
        orderId: recentOrder._id,
        totalAmount: finalAmount,
        fakeMode: true
      });
    }

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount: finalAmount,
      status: 'pending',
      paymentMethod: 'manual'
    });

    res.json({
      success: true,
      clientSecret: 'fake_' + order._id,
      orderId: order._id,
      totalAmount: finalAmount,
      fakeMode: true
    });

  } catch (err) {
    next(err);
  }
};


// ✅ هنا التعديل المهم
exports.confirmPayment = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // لو already processed
    if (
      order.status === 'paid_unconfirmed' ||
      order.status === 'completed'
    ) {
      return res.json({
        success: true,
        order,
        alreadyProcessed: true
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be processed'
      });
    }

    // ✅ بدل paid → paid_unconfirmed
    order.status = 'paid_unconfirmed';
    await order.save();

    res.json({
      success: true,
      order
    });

  } catch (err) {
    next(err);
  }
};


// مش مستخدم دلوقتي
exports.stripeWebhook = async (req, res) => {
  res.json({ received: true });
};