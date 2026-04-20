const paypal = require('@paypal/checkout-server-sdk');

const client = () => {
  const environment = new paypal.core.SandboxEnvironment( // sandbox هنا
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  );
  return new paypal.core.PayPalHttpClient(environment);
};

exports.createPayPalOrder = async (req, res) => {
  try {
    const { amount, orderId } = req.body;
    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'USD', value: Number(amount).toFixed(2) },
        custom_id: orderId
      }]
    });
    const order = await client().execute(request);
    res.json({ success: true, paypalOrderId: order.result.id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.capturePayPalOrder = async (req, res) => {
  try {
    const { paypalOrderId, orderId } = req.body;
    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    const capture = await client().execute(request);

    if (capture.result.status === 'COMPLETED') {
      const Order = require('../models/Order');
      await Order.findByIdAndUpdate(orderId, { 
        status: 'paid_unconfirmed'
      });
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: 'Payment not completed' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};