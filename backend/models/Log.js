const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminName: String,
  action: { type: String, required: true },
  target: { type: String, required: true },
  details: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', logSchema); 