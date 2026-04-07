// backend/scripts/seedNutrition.js
const mongoose = require('mongoose');
const NutritionKnowledge = require('../models/NutritionKnowledge');
const connectDB = require('../config/db');

const seeds = [
  { title: '6月龄辅食添加原则', content: '从单一果泥开始，观察过敏反应', tags: ['6-8'], question: '6月龄宝宝首先添加哪种辅食？', answer: 'A' },
  { title: '便秘宝宝吃什么水果', content: '火龙果、西梅、梨富含膳食纤维', tags: ['便秘'], question: '以下哪种水果通便效果最好？', answer: 'B' }
];

async function seed() {
  await connectDB();
  await NutritionKnowledge.deleteMany();
  await NutritionKnowledge.insertMany(seeds);
  console.log('营养知识库已初始化');
  process.exit();
}
seed();