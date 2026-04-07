const mongoose = require('mongoose');

const UserResourceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  fertilizer: { type: Number, default: 0 },   // 肥料
  water: { type: Number, default: 0 },        // 水滴
  traceShards: { type: Number, default: 0 },  // 溯源碎片
  coupons: [{ code: String, discount: Number, expireAt: Date }], // 优惠券
});

module.exports = mongoose.model('UserResource', UserResourceSchema);