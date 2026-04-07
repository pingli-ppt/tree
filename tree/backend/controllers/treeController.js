const FruitTree = require('../models/FruitTree');
const UserResource = require('../models/UserResource');
const RedemptionCoupon = require('../models/RedemptionCoupon');
const { calculateStage, applyAccelerate } = require('../utils/growthCalculator');
const { generateTraceData, getStageSpecificData } = require('../utils/blockchainMock');
const { getSeasonalTreeType, getSeasonalProductName } = require('../utils/seasonHelper');

exports.getUserTrees = async (req, res) => {
  try {
    const { userId } = req.query;
    let trees = await FruitTree.find({ userId });
    // 更新每个树的阶段
    for (let tree of trees) {
      const { stage, remainingDays } = calculateStage(tree);
      tree.stage = stage;
      if (stage === 4 && tree.stage !== 4) {
        // 刚进入收获期
        await tree.save();
      } else {
        await tree.save();
      }
    }
    trees = await FruitTree.find({ userId });
    res.json(trees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.accelerateTree = async (req, res) => {
  try {
    const { treeId, type } = req.body; // type: 'fertilizer' or 'water'
    const userId = req.body.userId;
    const tree = await FruitTree.findById(treeId);
    if (!tree) return res.status(404).json({ error: '果树不存在' });
    const resource = await UserResource.findOne({ userId });
    let reduceHours = 0;
    if (type === 'fertilizer' && resource.fertilizer > 0) {
      reduceHours = 12;
      resource.fertilizer -= 1;
    } else if (type === 'water' && resource.water > 0) {
      reduceHours = 6;
      resource.water -= 1;
    } else {
      return res.status(400).json({ error: '资源不足' });
    }
    await resource.save();
    const newStageInfo = applyAccelerate(tree, reduceHours);
    await tree.save();
    res.json({ success: true, tree, stage: newStageInfo.stage, remainingDays: newStageInfo.remainingDays });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.harvestTree = async (req, res) => {
  try {
    const { treeId, userId } = req.body;
    const tree = await FruitTree.findById(treeId);
    if (!tree || tree.userId.toString() !== userId) return res.status(403).json({ error: '无权限' });
    const { stage } = calculateStage(tree);
    if (stage < 4) return res.status(400).json({ error: '果树尚未成熟' });
    // 生成兑换券
    let productName = '';
    let productType = '';
    let customFormula = '';
    if (tree.treeType === 'apple') productName = '苹果泥(6月龄+)', productType = 'stage';
    else if (tree.treeType === 'banana') productName = '香蕉泥(8月龄+)', productType = 'stage';
    else if (tree.treeType === 'dragonfruit') productName = '火龙果泥(防便秘)', productType = 'custom';
    else if (tree.treeType === 'peach') productName = getSeasonalProductName(), productType = 'seasonal';
    else productName = `${tree.treeType}果泥`, productType = 'custom';
    if (tree.customFormula) customFormula = tree.customFormula;
    const couponCode = 'CP' + Date.now() + Math.random().toString(36).substr(2, 6);
    const coupon = new RedemptionCoupon({
      userId,
      treeId,
      couponCode,
      productType,
      productName,
      customFormula,
      isValid: true,
      expiredAt: new Date(Date.now() + 30*24*3600000)
    });
    await coupon.save();
    // 删除果树或标记已收获？设计上收获后果树消失或置为已完成，这里删除
    await FruitTree.findByIdAndDelete(treeId);
    res.json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.plantCustomTree = async (req, res) => {
  try {
    const { userId, treeType, customFormula } = req.body;
    const traceId = generateTraceData(treeType, 0).traceId;
    const tree = new FruitTree({
      userId,
      treeType,
      customFormula,
      stage: 0,
      plantedAt: new Date(),
      stageStartAt: new Date(),
      traceId
    });
    await tree.save();
    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.plantSeasonalTree = async (req, res) => {
  try {
    const { userId } = req.body;
    const seasonalType = getSeasonalTreeType();
    const traceId = generateTraceData(seasonalType, 0).traceId;
    const expireDate = new Date();
    expireDate.setMonth(expireDate.getMonth() + 3);
    const tree = new FruitTree({
      userId,
      treeType: seasonalType,
      stage: 0,
      plantedAt: new Date(),
      stageStartAt: new Date(),
      traceId,
      isSeasonal: true,
      seasonExpireAt: expireDate
    });
    await tree.save();
    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};