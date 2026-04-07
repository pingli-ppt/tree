const mongoose = require('mongoose');

const FruitTreeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  treeType: { type: String, required: true }, // 'apple', 'banana', 'dragonfruit', 'peach'(季节), 'custom'等
  customFormula: { type: String }, // 定制配方描述
  stage: { type: Number, default: 0 }, // 0:幼苗期,1:开花期,2:结果期,3:成熟期,4:可收获
  plantedAt: { type: Date, default: Date.now },
  stageStartAt: { type: Date, default: Date.now }, // 当前阶段开始时间
  // 加速记录
  acceleratedCount: { type: Number, default: 0 },
  // 溯源关联ID
  traceId: { type: String, required: true, unique: true },
  isSeasonal: { type: Boolean, default: false },
  seasonExpireAt: { type: Date }, // 季节果树过期时间
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('FruitTree', FruitTreeSchema);