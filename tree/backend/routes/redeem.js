const express = require('express');
const { getUserCoupons, redeemProduct, exchangeCouponWithShards } = require('../controllers/redeemController');
const router = express.Router();

router.get('/coupons', getUserCoupons);
// 获取用户订单列表
router.get('/orders', async (req, res) => {
    try {
        const { userId } = req.query;
        const Order = require('../models/Order');
        const orders = await Order.find({ userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/redeem', redeemProduct);
router.post('/exchangeShards', exchangeCouponWithShards);

module.exports = router;