const express = require('express');
const router = express.Router();

// 模拟数据库
const profiles = {}; // { userId: {...} }

// 获取档案
router.get('/profile', (req, res) => {
    const { userId } = req.query;
    res.json(profiles[userId] || {});
});

// 更新档案
router.put('/profile', (req, res) => {
    const { userId, name, age, weight, allergy } = req.body;

    if (!userId) {
        return res.status(400).json({ error: '缺少 userId' });
    }

    profiles[userId] = {
        name,
        age,
        weight,
        allergy
    };

    res.json({ success: true });
});

module.exports = router;