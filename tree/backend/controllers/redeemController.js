const RedemptionCoupon = require('../models/RedemptionCoupon');
const Order = require('../models/Order');
const UserResource = require('../models/UserResource');

exports.getUserCoupons = async (req, res) => {
  const coupons = await RedemptionCoupon.find({ userId: req.query.userId, isValid: true });
  res.json(coupons);
};

exports.redeemProduct = async (req, res) => {
  try {
    const { userId, couponCode, address, customOptions } = req.body;
    const coupon = await RedemptionCoupon.findOne({ couponCode, userId, isValid: true });
    if (!coupon) return res.status(400).json({ error: '无效兑换券' });
    // 定制果泥可以修改配方
    let finalFormula = coupon.customFormula;
    if (coupon.productType === 'custom' && customOptions) {
      finalFormula = customOptions;
    }
    const order = new Order({
      userId,
      couponCode,
      productType: coupon.productType,
      productName: coupon.productName,
      customFormula: finalFormula,
      address,
      status: 'processing',
      traceLink: `https://trace.babyfood.com/order/${order._id}`
    });
    await order.save();
    coupon.isValid = false;
    await coupon.save();
    res.json({ success: true, orderId: order._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.exchangeCouponWithShards = async (req, res) => {
  const { userId } = req.body;
  const resource = await UserResource.findOne({ userId });
  if (resource.traceShards >= 10) {
    resource.traceShards -= 10;
    resource.coupons.push({ code: `DISCOUNT${Date.now()}`, discount: 5, expireAt: new Date(Date.now()+30*86400000) });
    await resource.save();
    res.json({ success: true, coupon: resource.coupons.slice(-1)[0] });
  } else {
    res.status(400).json({ error: '溯源碎片不足' });
  }
};