const Order = require('../models/Order');
const Product = require('../models/Product');
const DigitalCode = require('../models/DigitalCode');
const User = require('../models/User');
const emailService = require('../services/emailService');


// @GET /api/orders/my
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('items.product', 'name image category')
      .populate('items.codes', 'code')
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
};


// @GET /api/orders/:id
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name image category platform')
      .populate('items.codes', 'code');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (
      order.user.toString() !== req.user.id &&
      !req.user.hasPermission('admin')
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};



// ✅ CORE FUNCTION (تم تصحيحه)
exports.fulfillOrder = async (orderId) => {

  const order = await Order.findById(orderId)
    .populate('items.product', 'name image category platform')
    .populate('user', 'name email');

  // ✅ يشتغل فقط لو paid_unconfirmed
  if (!order || order.status !== 'paid_unconfirmed') {
    throw new Error('Order not ready for fulfillment');
  }

  const session = await Order.startSession();
  session.startTransaction();

  try {

    for (const item of order.items) {

      const allocatedCodes = [];

      for (let i = 0; i < item.quantity; i++) {

        const code = await DigitalCode.findOneAndUpdate(
          {
            product: item.product._id,
            isUsed: false
          },
          {
            isUsed: true,
            usedBy: order.user._id,
            usedAt: new Date(),
            order: order._id
          },
          {
            new: true,
            session
          }
        );

        if (!code) {
          throw new Error(`Out of stock: ${item.product.name}`);
        }

        allocatedCodes.push(code._id);

        await Product.findByIdAndUpdate(
          item.product._id,
          {
            $inc: { stock: -1, totalSold: 1 }
          },
          { session }
        );
      }

      item.codes = allocatedCodes;
      item.name = item.product.name;
      item.image = item.product.image;
    }

    // ✅ هنا الصح
    order.status = 'completed';

    await order.save({ session });

    await User.findByIdAndUpdate(
      order.user._id,
      { $addToSet: { orders: order._id } },
      { session }
    );

    await session.commitTransaction();

    return order;

  } catch (err) {

    await session.abortTransaction();

    order.status = 'failed';
    await order.save();

    throw err;

  } finally {
    session.endSession();
  }
};



// @GET /api/orders (admin)
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      orders
    });

  } catch (err) {
    next(err);
  }
};



// @PUT /api/orders/:id/status (admin)
exports.updateOrderStatus = async (req, res, next) => {
  try {

    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({ success: true, order });

  } catch (err) {
    next(err);
  }
};



// ✅ ده اللي الأدمن هيستخدمه
exports.confirmAndSend = async (req, res, next) => {
  try {

    let order = await Order.findById(req.params.id)
      .populate('items.product', 'name image category platform')
      .populate('items.codes', 'code')
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Order already confirmed'
      });
    }

    if (order.status !== 'paid_unconfirmed') {
      return res.status(400).json({
        success: false,
        message: 'Order not ready for confirmation'
      });
    }

    // ✅ اعمل Fulfillment الأول
    order = await exports.fulfillOrder(order._id);

    // ✅ ابعت الإيميل
    emailService
      .sendOrderConfirmation(order.user, order)
      .catch(console.error);

    res.json({
      success: true,
      message: 'Codes sent to customer successfully!',
      order
    });

  } catch (err) {
    next(err);
  }
};