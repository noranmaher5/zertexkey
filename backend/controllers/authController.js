const jwt = require('jsonwebtoken');
const User = require('../models/User');
const emailService = require('../services/emailService');
const { verifyGoogleToken } = require('../utils/googleVerify');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  user.password = undefined;
  res.status(statusCode).json({ success: true, token, user });
};

// @POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // First user becomes owner
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'owner' : 'user';

    const user = await User.create({ name, email, password, role, phone: phone || null });

    // Welcome email (non-blocking)
    emailService.sendWelcomeEmail(user).catch(console.error);

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account has been deactivated' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('orders', 'orderNumber totalAmount status createdAt');
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @PUT /api/auth/update-password
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @PUT /api/auth/update-profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;

    // بس الـ editor وفوق يقدروا يغيّروا الصورة
    const roleLevel = { user:0, editor:1, admin:2, manager:3, 'co-owner':4, owner:5 };
    if (avatar !== undefined && (roleLevel[req.user.role] || 0) >= 1) {
      updates.avatar = avatar;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id, updates, { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// @POST /api/auth/google
exports.googleAuth = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Google credential is required' });
    }

    // 1. Verify token
    const payload = await verifyGoogleToken(token);
    const { email, name, picture } = payload;

    // 2. Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // 3a. If user exists, log them in
      if (!user.isActive) {
        return res.status(401).json({ success: false, message: 'Account has been deactivated' });
      }
      
      // Optionally link it as a google user if it wasn't before
      if (!user.isGoogleUser) {
        user.isGoogleUser = true;
        await user.save();
      }
    } else {
      // 3b. If user doesn't exist, create them
      const userCount = await User.countDocuments();
      const role = userCount === 0 ? 'owner' : 'user';

      user = await User.create({
        name,
        email,
        isGoogleUser: true,
        role,
        avatar: picture || ''
      });
      
      // Welcome email
      emailService.sendWelcomeEmail(user).catch(console.error);
    }

    // 4. Generate JWT & return
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Google Auth Controller Error:', err);
    res.status(401).json({ success: false, message: 'Invalid Google authentication' });
  }
};
