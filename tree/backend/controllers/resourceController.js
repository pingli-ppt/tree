const UserResource = require('../models/UserResource');

exports.getUserResources = async (req, res) => {
  try {
    const { userId } = req.query;
    let resource = await UserResource.findOne({ userId });
    if (!resource) {
      resource = new UserResource({ userId, fertilizer: 0, water: 0, traceShards: 0 });
      await resource.save();
    }
    res.json({
      fertilizer: resource.fertilizer,
      water: resource.water,
      traceShards: resource.traceShards,
      coupons: resource.coupons || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 内部调用更新资源（由任务完成等触发）
exports.addResource = async (userId, delta) => {
  const resource = await UserResource.findOne({ userId });
  if (!resource) return;
  if (delta.fertilizer) resource.fertilizer += delta.fertilizer;
  if (delta.water) resource.water += delta.water;
  if (delta.traceShards) resource.traceShards += delta.traceShards;
  await resource.save();
  return resource;
};