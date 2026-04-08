const express = require('express');
const router = express.Router();

// 假数据（你可以换数据库）
let userResources = {}; // { userId: { shards: 100 } }
let orders = [];

router.post('/customPuree', (req, res) => {
    const { userId, age, flavor, address, phone } = req.body;

    if (!userId || !address) {
        return res.status(400).json({ error: '参数不完整' });
    }

    // 默认资源
    if (!userResources[userId]) {
        userResources[userId] = { shards: 50 };
    }

    // 💰 定价：20碎片
    const COST = 20;

    if (userResources[userId].shards < COST) {
        return res.status(400).json({ error: '碎片不足' });
    }

    // 扣资源
    userResources[userId].shards -= COST;

    // 生成订单
    const order = {
        id: Date.now(),
        userId,
        age,
        flavor,
        address,
        phone,
        status: '制作中',
        createTime: new Date()
    };

    orders.push(order);

    res.json({
        success: true,
        message: '定制成功',
        order
    });
});

module.exports = router;