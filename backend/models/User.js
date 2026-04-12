const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const ROLES = ['user', 'editor', 'admin', 'manager', 'co-owner', 'owner'];

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [function () { return !this.isGoogleUser; }, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  phone: {
    type: String,
    trim: true,
    default: null
  },
  isGoogleUser: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ROLES,
    default: 'user'
  },
avatar: {
  type: String,
  default: ''
},
phone: {
  type: String,
  default: ''
},
  isActive: {
    type: Boolean,
    default: true
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if password changed after JWT was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Role permission levels
userSchema.methods.hasPermission = function (requiredRole) {
  const roleHierarchy = { user: 0, editor: 1, admin: 2, manager: 3, 'co-owner': 4, owner: 5 };
  return roleHierarchy[this.role] >= roleHierarchy[requiredRole];
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
