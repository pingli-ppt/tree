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
  try {
    // 随机取一条（更合理）
    const count = await NutritionKnowledge.countDocuments();

    let q = null;

    if (count > 0) {
      const rand = Math.floor(Math.random() * count);
      q = await NutritionKnowledge.findOne().skip(rand);
    }

    // ⭐ 如果数据库没数据 → 用默认题（关键！）
    if (!q) {
      return res.json({
        id: 'default1',
        question: '6个月宝宝可以吃什么辅食？',
        options: [
          { key: 'A', text: '苹果泥' },
          { key: 'B', text: '辣条' },
          { key: 'C', text: '可乐' }
        ],
        correctAnswer: 'A'
      });
    }

    // ⭐ 有数据正常返回
    res.json({
      id: q._id,
      question: q.question,
      options: q.options, // 建议你数据库也存成这个结构
      correctAnswer: q.answer
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};