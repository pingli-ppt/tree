const TaskProgress = require('../models/TaskProgress');
const UserResource = require('../models/UserResource');
const BabyProfile = require('../models/BabyProfile');
const NutritionKnowledge = require('../models/NutritionKnowledge');

// 每日任务定义
const dailyTasksList = [
  { id: 'signin', name: '每日签到', reward: { water: 1 } },
  { id: 'quiz', name: '辅食答题', reward: { fertilizer: 1 } },
  { id: 'viewTrace', name: '查看溯源内容', reward: { water: 1 } },
  { id: 'share', name: '分享果树', reward: { fertilizer: 1 } }
];

exports.getDailyTasks = async (req, res) => {
  try {
    const { userId } = req.query;
    let taskProg = await TaskProgress.findOne({ userId });
    const today = new Date().toISOString().split('T')[0];
    if (taskProg.lastResetDate !== today) {
      // 重置每日任务记录
      taskProg.dailyTasks = new Map();
      taskProg.lastResetDate = today;
      await taskProg.save();
    }
    const tasks = dailyTasksList.map(t => ({
      ...t,
      completed: taskProg.dailyTasks.get(`${t.id}_${today}`) || false
    }));
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.completeDailyTask = async (req, res) => {
  try {
    const { userId, taskId } = req.body;
    const task = dailyTasksList.find(t => t.id === taskId);
    if (!task) return res.status(400).json({ error: '无效任务' });
    let taskProg = await TaskProgress.findOne({ userId });
    const today = new Date().toISOString().split('T')[0];
    const key = `${taskId}_${today}`;
    if (taskProg.dailyTasks.get(key)) return res.status(400).json({ error: '今日已完成' });
    // 特殊任务逻辑: 答题需校验答案
    if (taskId === 'quiz') {
      const { answer, questionId } = req.body;
      const knowledge = await NutritionKnowledge.findById(questionId);
      if (!knowledge || knowledge.answer !== answer) {
        return res.status(400).json({ error: '答案错误' });
      }
    }
    taskProg.dailyTasks.set(key, true);
    await taskProg.save();
    // 发放奖励
    const resource = await UserResource.findOne({ userId });
    if (task.reward.water) resource.water += task.reward.water;
    if (task.reward.fertilizer) resource.fertilizer += task.reward.fertilizer;
    await resource.save();
    res.json({ success: true, reward: task.reward });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 成长任务 (示例)
exports.getGrowthTasks = async (req, res) => {
  const growthList = [
    { id: 'profile', name: '完善宝宝档案', reward: { fertilizer: 5, unlockCustom: true } },
    { id: 'video', name: '观看区块链溯源视频', reward: { traceShards: 10 } },
    { id: 'firstOrder', name: '首次下单果泥', reward: { seasonalSeed: true } },
    { id: 'feedback', name: '分享辅食反馈', reward: { fertilizer: 3, traceShards: 5 } }
  ];
  const taskProg = await TaskProgress.findOne({ userId: req.query.userId });
  const tasks = growthList.map(t => ({
    ...t,
    completed: taskProg.growthTasks.get(t.id) || false
  }));
  res.json(tasks);
};

exports.completeGrowthTask = async (req, res) => {
  const { userId, taskId } = req.body;
  const taskProg = await TaskProgress.findOne({ userId });
  if (taskProg.growthTasks.get(taskId)) return res.status(400).json({ error: '已完成' });
  taskProg.growthTasks.set(taskId, true);
  await taskProg.save();
  // 发放奖励特殊处理（如解锁定制果树权限等，可另行记录用户flag，简化在resource中加字段或创建专门flag表，此处略）
  const resource = await UserResource.findOne({ userId });
  if (taskId === 'profile') resource.fertilizer += 5;
  if (taskId === 'video') resource.traceShards += 10;
  if (taskId === 'feedback') { resource.fertilizer += 3; resource.traceShards += 5; }
  await resource.save();
  res.json({ success: true });
};