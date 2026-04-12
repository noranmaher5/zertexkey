const Product = require('../models/Product');
const DigitalCode = require('../models/DigitalCode');

// GET ALL PRODUCTS
exports.getProducts = async (req, res, next) => {
  try {
    const {
      category, platform, region, minPrice, maxPrice,
      search, sort, page = 1, limit = 12, featured
    } = req.query;

    const query = { isActive: true };

    if (category) query.category = category;
    if (platform) query.platform = new RegExp(platform, 'i');
    if (region) query.region = new RegExp(region, 'i');
    if (featured === 'true') query.isFeatured = true;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // ✅ SEARCH FIX
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
    const product = await Product.findOne({
      $or: [
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
        { slug: req.params.id }
      ],
      isActive: true
    }).populate('reviews.user', 'name avatar');

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
    req.body.createdBy = req.user.id;
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// UPDATE PRODUCT
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

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

    res.json({ success: true, message: 'Product deactivated successfully' });
  } catch (err) {
    next(err);
  }
};

// ADD REVIEW
exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const alreadyReviewed = product.reviews.find(
      r => r.user.toString() === req.user.id
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'You already reviewed this product'
      });
    }

    product.reviews.push({
      user: req.user.id,
      rating: Number(rating),
      comment
    });

    product.updateRating();
    await product.save();

    res.status(201).json({ success: true, message: 'Review added' });
  } catch (err) {
    next(err);
  }
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