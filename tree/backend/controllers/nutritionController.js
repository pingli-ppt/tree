const NutritionKnowledge = require('../models/NutritionKnowledge');
const BabyProfile = require('../models/BabyProfile');

exports.getDailyTip = async (req, res) => {
  const count = await NutritionKnowledge.countDocuments();
  const random = Math.floor(Math.random() * count);
  const tip = await NutritionKnowledge.findOne().skip(random);
  res.json(tip);
};

exports.searchKnowledge = async (req, res) => {
  const { keyword, monthAge } = req.query;
  let query = {};
  if (keyword) query.$or = [{ title: { $regex: keyword, $options: 'i' } }, { content: { $regex: keyword, $options: 'i' } }];
  if (monthAge) query.tags = monthAge;
  const results = await NutritionKnowledge.find(query).limit(10);
  res.json(results);
};

exports.getQuizQuestion = async (req, res) => {
  const count = await NutritionKnowledge.countDocuments({ question: { $exists: true, $ne: null } });
  const random = Math.floor(Math.random() * count);
  const q = await NutritionKnowledge.findOne({ question: { $exists: true } }).skip(random);
  res.json({ id: q._id, question: q.question, options: ['选项A','选项B','选项C'], answer: q.answer });
};