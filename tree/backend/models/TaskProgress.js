const mongoose = require('mongoose');

const TaskProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // 每日任务记录: key为任务名+日期
  dailyTasks: { type: Map, of: Boolean, default: {} },
  // 成长任务记录: 永久完成标记
  growthTasks: { type: Map, of: Boolean, default: {} },
  lastResetDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
});

module.exports = mongoose.model('TaskProgress', TaskProgressSchema);