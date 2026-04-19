const mongoose = require('mongoose');

const discountCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: String,

  // نوع الخصم: percentage أو fixed
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage',
  },
  value: {
    type: Number,
    required: true,
    min: 0,
  },

  // حد أقصى للاستخدام الكلي (0 = غير محدود)
  maxUses: {
    type: Number,
    default: 0,
  },
  // حد أقصى لكل يوزر
  maxUsesPerUser: {
    type: Number,
    default: 1,
  },

  // عدد الاستخدامات الفعلية
  usedCount: {
    type: Number,
    default: 0,
  },

  // اليوزرات اللي استخدموا الكود
  usedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    usedAt: { type: Date, default: Date.now },
    discountAmount: Number,
  }],

  // تاريخ انتهاء الصلاحية (اختياري)
  expiresAt: Date,

  isActive: {
    type: Boolean,
    default: true,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

module.exports = mongoose.model('DiscountCode', discountCodeSchema);