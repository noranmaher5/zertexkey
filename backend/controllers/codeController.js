const DigitalCode = require('../models/DigitalCode');
const Product = require('../models/Product');

// @POST /api/codes/bulk
exports.addCodesBulk = async (req, res, next) => {
  try {
    const { productId, codes } = req.body;

    if (!productId || !codes || !Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ success: false, message: 'productId and codes array are required' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Filter blank codes, deduplicate
    const cleanCodes = [...new Set(codes.map(c => c.trim()).filter(Boolean))];

    // Check for existing codes to avoid duplicates
    const existingCodes = await DigitalCode.find({
      product: productId,
      code: { $in: cleanCodes }
    }).select('code');

    const existingSet = new Set(existingCodes.map(c => c.code));
    const newCodes = cleanCodes.filter(c => !existingSet.has(c));

    if (newCodes.length === 0) {
      return res.status(400).json({ success: false, message: 'All codes already exist for this product' });
    }

    const codeDocuments = newCodes.map(code => ({
      product: productId,
      code,
      addedBy: req.user.id
    }));

    const inserted = await DigitalCode.insertMany(codeDocuments);

    // Update product stock count
    const totalAvailable = await DigitalCode.countDocuments({ product: productId, isUsed: false });
    await Product.findByIdAndUpdate(productId, { stock: totalAvailable });

    res.status(201).json({
      success: true,
      message: `Added ${inserted.length} codes (${existingCodes.length} duplicates skipped)`,
      added: inserted.length,
      skipped: existingCodes.length
    });
  } catch (err) {
    next(err);
  }
};

// @GET /api/codes/product/:productId
exports.getProductCodes = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { used, page = 1, limit = 50 } = req.query;

    const query = { product: productId };
    if (used !== undefined) query.isUsed = used === 'true';

    const total = await DigitalCode.countDocuments(query);
    const codes = await DigitalCode.find(query)
      .populate('usedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const stats = await DigitalCode.aggregate([
      { $match: { product: require('mongoose').Types.ObjectId.createFromHexString(productId) } },
      { $group: { _id: '$isUsed', count: { $sum: 1 } } }
    ]);

    const statsMap = { available: 0, used: 0 };
    stats.forEach(s => { if (s._id === false) statsMap.available = s.count; else statsMap.used = s.count; });

    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), codes, stats: statsMap });
  } catch (err) {
    next(err);
  }
};

// @DELETE /api/codes/:id
exports.deleteCode = async (req, res, next) => {
  try {
    const code = await DigitalCode.findById(req.params.id);
    if (!code) return res.status(404).json({ success: false, message: 'Code not found' });
    if (code.isUsed) return res.status(400).json({ success: false, message: 'Cannot delete a used code' });

    await code.deleteOne();

    // Update stock
    const totalAvailable = await DigitalCode.countDocuments({ product: code.product, isUsed: false });
    await Product.findByIdAndUpdate(code.product, { stock: totalAvailable });

    res.json({ success: true, message: 'Code deleted' });
  } catch (err) {
    next(err);
  }
};

// @GET /api/codes/stats
exports.getCodeStats = async (req, res, next) => {
  try {
    const stats = await DigitalCode.aggregate([
      {
        $group: {
          _id: '$product',
          total: { $sum: 1 },
          used: { $sum: { $cond: ['$isUsed', 1, 0] } },
          available: { $sum: { $cond: [{ $not: '$isUsed' }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      { $project: { 'product.name': 1, 'product.category': 1, total: 1, used: 1, available: 1 } },
      { $sort: { available: 1 } } // Low stock first
    ]);

    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
};
