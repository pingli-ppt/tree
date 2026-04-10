const RedemptionCoupon = require('../models/RedemptionCoupon');
const Order = require('../models/Order');
const UserResource = require('../models/UserResource');

exports.getUserCoupons = async (req, res) => {
  const coupons = await RedemptionCoupon.find({ userId: req.query.userId, isValid: true });
  res.json(coupons);
};

exports.redeemProduct = async (req, res) => {
    try {
        const { userId, couponCode, address, phone, customOptions } = req.body;
        
        const coupon = await RedemptionCoupon.findOne({ couponCode, userId, isValid: true });
        if (!coupon) {
            return res.status(400).json({ error: '无效兑换券' });
        }
        
        // 兼容两种格式
        let addressObj = address;
        if (typeof address === 'string') {
            addressObj = {
                name: '用户',
                phone: phone || '',
                address: address
            };
        }
        
        const order = new Order({
            userId,
            couponCode,
            productType: coupon.productType,
            productName: coupon.productName,
            customFormula: customOptions || coupon.customFormula,
            address: addressObj,
            status: 'processing'
        });
        
        await order.save();
        coupon.isValid = false;
        await coupon.save();
        
        res.json({ success: true, orderId: order._id });
    } catch (err) {
        console.error('兑换失败:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.exchangeCouponWithShards = async (req, res) => {
    try {
        const { userId } = req.body;
        
        // 获取用户资源
        const resource = await UserResource.findOne({ userId });
        if (!resource) {
            return res.status(400).json({ error: '用户资源不存在' });
        }
        
        // 检查碎片
        if (resource.traceShards < 10) {
            return res.status(400).json({ error: '溯源碎片不足，需要10碎片' });
        }
        
        // 扣除碎片
        resource.traceShards -= 10;
        await resource.save();
        
        // 创建优惠券
        const couponCode = 'CP' + Date.now() + Math.random().toString(36).substr(2, 8).toUpperCase();
        const coupon = new RedemptionCoupon({
            userId: userId,
            couponCode: couponCode,
            productName: '5元优惠券',
            productType: 'exchange',
            isValid: true,
            expiredAt: new Date(Date.now() + 30 * 24 * 3600000)
        });
        
        await coupon.save();
        console.log('创建优惠券成功:', coupon);
        
        res.json({ 
            success: true, 
            coupon: {
                couponCode: coupon.couponCode,
                productName: coupon.productName
            }
        });
    } catch (err) {
        console.error('兑换失败:', err);
        res.status(500).json({ error: err.message });
    }
};