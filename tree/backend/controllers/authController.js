const User = require('../models/User');
const BabyProfile = require('../models/BabyProfile');
const FruitTree = require('../models/FruitTree');
const UserResource = require('../models/UserResource');
const TaskProgress = require('../models/TaskProgress');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateTraceData } = require('../utils/blockchainMock');

exports.register = async (req, res) => {
  try {
    const { username, password, babyMonthAge } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed });
    await user.save();

    // 创建宝宝档案
    const profile = new BabyProfile({ userId: user._id, monthAge: babyMonthAge || 6 });
    await profile.save();

    // 初始化资源
    const resource = new UserResource({ userId: user._id, fertilizer: 2, water: 5 });
    await resource.save();

    // 初始化任务进度
    const taskProg = new TaskProgress({ userId: user._id });
    await taskProg.save();

    // 创建默认基础果树 (苹果树)
    const traceId = generateTraceData('apple', 0).traceId;
    const tree = new FruitTree({
      userId: user._id,
      treeType: 'apple',
      stage: 0,
      plantedAt: new Date(),
      stageStartAt: new Date(),
      traceId
    });
    await tree.save();

    const token = jwt.sign({ id: user._id }, 'secretkey', { expiresIn: '7d' });
    res.status(201).json({ token, userId: user._id, username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: '用户不存在' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: '密码错误' });
    const token = jwt.sign({ id: user._id }, 'secretkey', { expiresIn: '7d' });
    res.json({ token, userId: user._id, username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};