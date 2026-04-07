const express = require('express');
const { getUserCoupons, redeemProduct, exchangeCouponWithShards } = require('../controllers/redeemController');
const router = express.Router();

router.get('/coupons', getUserCoupons);
router.post('/redeem', redeemProduct);
router.post('/exchangeShards', exchangeCouponWithShards);

module.exports = router;