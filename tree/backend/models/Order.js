const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  couponCode: { type: String },
  productType: String,
  productName: String,
  customFormula: String,
  address: { name: String, phone: String, address: String },
  status: { type: String, default: 'pending' }, // pending, processing, shipped
  trackingInfo: { type: String },
  traceLink: { type: String }, // 订单溯源链接
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', OrderSchema);