const Order = require('../models/Order');
const Product = require('../models/Product');
const DigitalCode = require('../models/DigitalCode');
const { fulfillOrder } = require('./orderController');

exports.getConfig = async (req, res) => {
  res.json({ success: true, publishableKey: 'fake_key', fakeMode: true });
};

exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'No items' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: 'Product not found' });
      }

      const available = await DigitalCode.countDocuments({ 
        product: product._id, isUsed: false 
      });
      if (available < item.quantity) {
        return res.status(400).json({ 
          success: false, message: `Out of stock: ${product.name}` 
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

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount: Math.round(totalAmount * 100) / 100,
      status: 'pending',
      paymentMethod: 'manual'
    });

    res.json({ 
      success: true, 
      clientSecret: 'fake_' + order._id, 
      orderId: order._id, 
      totalAmount, 
      fakeMode: true 
    });
  } catch (err) { 
    next(err); 
  }
};

exports.confirmPayment = async (req, res, next) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      user: req.user.id 
    });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Already processed' });
    }

    order.status = 'paid';
    await order.save();

    const fulfilled = await fulfillOrder(order._id);
    res.json({ success: true, order: fulfilled });
  } catch (err) { 
    next(err); 
  }
};

exports.stripeWebhook = async (req, res) => res.json({ received: true });