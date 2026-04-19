const Product = require('../models/Product');
const DigitalCode = require('../models/DigitalCode');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const User = require('../models/User');

// GET ALL PRODUCTS
exports.getProducts = async (req, res, next) => {
  try {
    const {
      category, platform, region, minPrice, maxPrice,
      search, sort, page = 1, limit = 12, featured,
      isAdmin,
      activeTab // استلام التبويب من الطلب (live أو hidden)
    } = req.query;

    let query = {};

    // منطق الفلترة المتقدم للأدمن
    if (isAdmin === 'true') {
      if (activeTab === 'live') {
        query.isActive = true;
      } else if (activeTab === 'hidden') {
        query.isActive = false;
      }
      // إذا لم يرسل activeTab، سيجلب كل شيء (اختياري)
    } else {
      // للمستخدم العادي، يرى النشط فقط دائماً
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

    // بناء الكويري للبحث عن المنتج
    const findQuery = {
      $or: [
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
        { slug: req.params.id }
      ]
    };

    // إذا لم يكن أدمن، يجب أن يكون المنتج نشطاً ليراه
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

// CREATE PRODUCT (المعدلة لدعم رفع الصور والحقول الجديدة)
exports.createProduct = async (req, res, next) => {
  try {
    const productData = { ...req.body };
    
    // إسناد المعرف الخاص بالمستخدم الذي قام بالإنشاء
    productData.createdBy = req.user.id;

    // ✅ التحقق من وجود ملف صورة مرفوع بواسطة Multer
    if (req.file) {
      // نخزن المسار الذي سيتعرف عليه السيرفر لاحقاً لعرض الصورة
      productData.image = req.file.path; // Cloudinary URL
    }

    // ✅ معالجة الـ Tags (لأن FormData تحول المصفوفة لنص)
    if (productData.tags && typeof productData.tags === 'string') {
      try {
        productData.tags = JSON.parse(productData.tags);
      } catch (e) {
        // إذا فشل JSON.parse، نقوم بتقسيم النص يدوياً بواسطة الفاصلة
        productData.tags = productData.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    const product = await Product.create(productData);
    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// UPDATE PRODUCT (المعدلة لدعم تحديث الصور والحقول الجديدة)
exports.updateProduct = async (req, res, next) => {
  try {
    let productData = { ...req.body };

    // ✅ إذا تم رفع صورة جديدة، نقوم بتحديث مسار الصورة
    if (req.file) {
      productData.image = req.file.path; // Cloudinary URL
    }

    // ✅ معالجة الـ Tags عند التحديث
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
// إضافة تقييم - للمشترين فقط
exports.addReview = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { rating, comment } = req.body;

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
    
    if (product.reviews.find(r => r.user.toString() === req.user.id)) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });
    }

    product.reviews.push({
      user: req.user.id,
      name: req.user.name,
      rating: Number(rating),
      comment
    });

    product.updateRating();
    await product.save();

    // إرسال إشعار للأدمن
    await Notification.create({
      user: product.createdBy, // صاحب المنتج
      type: 'general',
      title: 'New Review Received',
      message: `User ${req.user.name} reviewed ${product.name}`,
      metadata: { productId: product._id },
      actionUrl: `/products/${product.slug || product._id}`
    });

    res.status(201).json({ success: true, message: 'Review added' });
  } catch (err) { next(err); }
};
// حذف تقييم - متاح للأدوار الإدارية

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