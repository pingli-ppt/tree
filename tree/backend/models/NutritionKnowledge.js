const mongoose = require('mongoose');

const NutritionKnowledgeSchema = new mongoose.Schema({
  title: String,
  content: String,
  tags: [String], // 月龄标签: '6-8', '9-12', 过敏相关
  question: String, // 用于答题
  answer: String,
  createdAt: Date,
});

module.exports = mongoose.model('NutritionKnowledge', NutritionKnowledgeSchema);