const mongoose = require('mongoose');

const digitalCodeSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  code: {
    type: String,
    required: [true, 'Code is required'],
    trim: true
  },
  isUsed: {
    type: Boolean,
    default: false,
    index: true
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  usedAt: {
    type: Date,
    default: null
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, {
  timestamps: true
});

// Compound index for fast unused code lookup per product
digitalCodeSchema.index({ product: 1, isUsed: 1 });

module.exports = mongoose.model('DigitalCode', digitalCodeSchema);
