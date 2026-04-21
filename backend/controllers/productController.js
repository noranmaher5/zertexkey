const Product = require('../models/Product');
const DigitalCode = require('../models/DigitalCode');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Log = require('../models/Log');

// GET ALL PRODUCTS
exports.getProducts = async (req, res, next) => {
  try {
    const {
      category, platform, region, minPrice, maxPrice,
      search, sort, page = 1, limit = 12, featured,
      isAdmin,
      activeTab 
    } = req.query;

    let query = {};

    if (isAdmin === 'true') {
      if (activeTab === 'live') {
        query.isActive = true;
      } else if (activeTab === 'hidden') {
        query.isActive = false;
      }
    } else {
      query.isActive = true;
    }

    if (category) query.category = category;
    if (platform) query.platform = new RegExp(platform, 'i');
    if (region) query.region = new RegExp(region, 'i');
    if (featured === 'true') query.isFeatured = true;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const keyword = search || req.query.keyword;
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { tags: { $in: [new RegExp(keyword, 'i')] } }
      ];
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      popular: { totalSold: -1 },
      rating: { 'rating.average': -1 }
    };

    const sortBy = sortOptions[sort] || { createdAt: -1 };
    const skip = (Number(page) - 1) * Number(limit);
    
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(Number(limit))
      .select('-reviews');

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      products
    });
  } catch (err) {
    next(err);
  }
};

// GET SINGLE PRODUCT
exports.getProduct = async (req, res, next) => {
  try {
    const { isAdmin } = req.query;

    const findQuery = {
      $or: [
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
        { slug: req.params.id }
      ]
    };

    if (isAdmin !== 'true') {
      findQuery.isActive = true;
    }

    const product = await Product.findOne(findQuery).populate('reviews.user', 'name avatar');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const availableCodes = await DigitalCode.countDocuments({
      product: product._id,
      isUsed: false
    });

    const productObj = product.toJSON();
    productObj.availableStock = availableCodes;

    res.json({ success: true, product: productObj });
  } catch (err) {
    next(err);
  }
};

// CREATE PRODUCT
exports.createProduct = async (req, res, next) => {
  try {
    const productData = { ...req.body };
    productData.createdBy = req.user.id;

    if (req.file) {
      productData.image = req.file.path;
    }

    if (productData.tags && typeof productData.tags === 'string') {
      try {
        productData.tags = JSON.parse(productData.tags);
      } catch (e) {
        productData.tags = productData.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    const product = await Product.create(productData);

   
    try {
      await Log.create({
        adminId:   req.user.id,
        adminName: req.user.name || req.user.username || 'Admin',
        action:    'PRODUCT_CREATED',
        target:    `Product: ${product.name}`,
        details:   `Price: $${product.price} · Category: ${product.category || 'N/A'}`,
      });
    } catch (e) { console.error('Log error:', e); }

    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// UPDATE PRODUCT
exports.updateProduct = async (req, res, next) => {
  try {
    let productData = { ...req.body };

    if (req.file) {
      productData.image = req.file.path;
    }

    if (productData.tags && typeof productData.tags === 'string') {
      try {
        productData.tags = JSON.parse(productData.tags);
      } catch (e) {
        productData.tags = productData.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    const product = await Product.findByIdAndUpdate(req.params.id, productData, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

   
    try {
      await Log.create({
        adminId:   req.user.id,
        adminName: req.user.name || req.user.username || 'Admin',
        action:    'PRODUCT_UPDATED',
        target:    `Product: ${product.name}`,
        details:   `Updated fields: ${Object.keys(req.body).join(', ')}`,
      });
    } catch (e) { console.error('Log error:', e); }

    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// DELETE PRODUCT (SOFT DELETE)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

   
    try {
      await Log.create({
        adminId:   req.user.id,
        adminName: req.user.name || req.user.username || 'Admin',
        action:    'PRODUCT_DELETED',
        target:    `Product: ${product.name}`,
        details:   `Product deactivated (soft delete)`,
      });
    } catch (e) { console.error('Log error:', e); }

    res.json({ success: true, message: 'Product deactivated successfully' });
  } catch (err) {
    next(err);
  }
};

// ADD REVIEW 
exports.addReview = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { rating, comment } = req.body;

    // 1.check if user has purchased the product before allowing review
    const hasPurchased = await Order.findOne({
      user: req.user.id,
      status: 'completed',
      'items.product': productId
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: 'You can only review products you have purchased.'
      });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    
    // 2. prevent duplicate review
    if (product.reviews.find(r => r.user.toString() === req.user.id)) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });
    }

 
   
    const displayName = req.user.name || req.user.username || 'Customer';

    product.reviews.push({
      user: req.user.id,
      name: displayName, 
      rating: Number(rating),
      comment
    });

    product.updateRating();
    await product.save();

    
    try {
      await Notification.create({
        user: product.createdBy || req.user.id, 
        type: 'general',
        title: 'New Review',
        message: `${displayName} reviewed ${product.name}`,
        metadata: { productId: product._id },
        actionUrl: `/products/${product.slug || product._id}`
      });
    } catch (e) { console.log("Notification error ignored"); }

    res.status(201).json({ success: true, message: 'Review added successfully' });
  } catch (err) { 
    next(err); 
  }
};

// DELETE REVIEW
exports.deleteReview = async (req, res, next) => {
  try {
    const { productId, reviewId } = req.params;
    const product = await Product.findById(productId);
    
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.reviews = product.reviews.filter(r => r._id.toString() !== reviewId);
    product.updateRating();
    await product.save();

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (err) { next(err); }
};

// CATEGORY STATS
exports.getCategoryStats = async (req, res, next) => {
  try {
    const stats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
};