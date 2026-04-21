const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  siteName: {
    type: String,
    default: 'Digivault'
  },
  // ── إعدادات الإشعارات بالإيميل ────────────────────────────────────────────
  emailNotifications: {
    orderConfirmation: { type: Boolean, default: true },  
    welcomeEmail:      { type: Boolean, default: true },  
    lowStockAlert:     { type: Boolean, default: true },  
    adminNewOrder:     { type: Boolean, default: false }, 
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
