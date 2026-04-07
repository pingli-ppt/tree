const mongoose = require('mongoose');

const RedemptionCouponSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  treeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FruitTree' },
  couponCode: { type: String, required: true, unique: true },
  productType: { type: String, required: true }, // 'stage', 'custom', 'seasonal'
  productName: { type: String },
  customFormula: { type: String },
  isValid: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  expiredAt: { type: Date },
});

module.exports = mongoose.model('RedemptionCoupon', RedemptionCouponSchema);