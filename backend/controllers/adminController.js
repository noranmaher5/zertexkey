const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const DigitalCode = require('../models/DigitalCode');

// @GET /api/admin/dashboard
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers, totalProducts, totalOrders,
      revenueData, recentOrders, lowStockProducts,
      ordersByStatus, monthlySales
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments({ status: { $in: ['paid', 'completed'] } }),
      Order.aggregate([
        { $match: { status: { $in: ['paid', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.find({ status: { $in: ['paid', 'completed', 'pending'] } })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5),
      Product.find({ isActive: true, stock: { $lte: 5 } })
        .sort({ stock: 1 })
        .limit(10)
        .select('name stock category'),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        {
          $match: {
            status: { $in: ['paid', 'completed'] },
            createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: revenueData[0]?.total || 0,
        recentOrders,
        lowStockProducts,
        ordersByStatus: Object.fromEntries(ordersByStatus.map(s => [s._id, s.count])),
        monthlySales
      }
    });
  } catch (err) {
    next(err);
  }
};

// @GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') }
    ];

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-password');

    res.json({ success: true, total, users });
  } catch (err) {
    next(err);
  }
};

// @PUT /api/admin/users/:id/role
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    // Owner-only: prevent non-owners from assigning owner role
    if (role === 'owner' && req.user.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only owners can assign owner role' });
    }
    // Co-owner cannot change owner's role
    if (targetUser.role === 'owner' && req.user.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Cannot change owner role' });
    }

    targetUser.role = role;
    await targetUser.save();
    res.json({ success: true, user: targetUser });
  } catch (err) {
    next(err);
  }
};

// @PUT /api/admin/users/:id/toggle-status
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'owner') return res.status(403).json({ success: false, message: 'Cannot deactivate owner' });

    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
  } catch (err) {
    next(err);
  }
};
