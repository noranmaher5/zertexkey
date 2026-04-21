const Cart = require('../models/Cart');
const Product = require('../models/Product');


const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

// @GET /api/cart
exports.getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    res.json({ success: true, cart });
  } catch (err) { next(err); }
};

// @POST /api/cart/add
exports.addItem = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const cart = await getOrCreateCart(req.user.id);

    if (!product.isUnlimited) {
      const available = Number(product.stock || 0);
      if (available <= 0 || product.isOutOfStock) {
        return res.status(400).json({ success: false, message: 'Product is out of stock' });
      }

      const currentInCart = cart.items.find(i => i.product.toString() === productId)?.quantity || 0;
      if (currentInCart + quantity > available) {
        return res.status(400).json({
          success: false,
          message: `Only ${available - currentInCart} item(s) left in stock`
        });
      }
    }

    const existingIndex = cart.items.findIndex(
      i => i.product.toString() === productId
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({
        product:  product._id,
        name:     product.name,
        image:    product.image,
        price:    product.price,
        category: product.category,
        quantity
      });
    }

    await cart.save();
    res.json({ success: true, cart });
  } catch (err) { next(err); }
};

// @PUT /api/cart/update
exports.updateItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const cart = await getOrCreateCart(req.user.id);
    const item = cart.items.find(i => i.product.toString() === productId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    if (!product.isUnlimited) {
      const available = Number(product.stock || 0);
      if (available <= 0 || product.isOutOfStock) {
        return res.status(400).json({ success: false, message: 'Product is out of stock' });
      }
      if (quantity > available) {
        return res.status(400).json({
          success: false,
          message: `Only ${available} item(s) available`
        });
      }
    }

    item.quantity = quantity;
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) { next(err); }
};

// @DELETE /api/cart/remove/:productId
exports.removeItem = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    cart.items = cart.items.filter(
      i => i.product.toString() !== req.params.productId
    );
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) { next(err); }
};

// @DELETE /api/cart/clear
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    cart.items = [];
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) { next(err); }
};
