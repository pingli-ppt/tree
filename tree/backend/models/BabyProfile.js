const mongoose = require('mongoose');

const BabyProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  babyName: { type: String },
  monthAge: { type: Number, required: true, default: 6 }, // 月龄
  allergies: [String],      // 过敏史 ['芒果','蛋白']
  preferences: [String],    // 饮食偏好 ['苹果','香蕉']
  constipationProne: { type: Boolean, default: false }, // 易便秘
  stomachWeak: { type: Boolean, default: false },       // 脾胃弱
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BabyProfile', BabyProfileSchema);