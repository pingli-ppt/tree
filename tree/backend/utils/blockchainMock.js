// 模拟区块链存证数据
const crypto = require('crypto');

function generateTraceData(treeType, stage) {
  const baseData = {
    traceId: crypto.randomBytes(16).toString('hex'),
    farmInfo: {
      name: '北纬37°有机农场',
      location: '山东省烟台市',
      soilData: { pH: 6.5, humidity: '65%', temperature: '22°C' },
    },
    records: {
      seeding: '2024-03-01',
      fertilizing: [
        { type: '有机羊粪肥', date: '2024-03-10', blockchainHash: '0x7a3f...' }
      ],
      pestControl: '物理防虫板+诱虫灯，无农药',
      testing: {
        reportId: 'FT-2024-0325',
        pesticideResidue: '未检出',
        heavyMetal: '符合国标',
        reportUrl: 'https://trace.example.com/report/' + crypto.randomBytes(8).toString('hex')
      }
    },
    blockTimestamp: new Date().toISOString(),
    blockHash: crypto.createHash('sha256').update(Date.now().toString()).digest('hex')
  };
  return baseData;
}

function getStageSpecificData(stage, treeType) {
  const stageMap = {
    0: { description: '幼苗破土，根系发育', image: 'seedling.png' },
    1: { description: '花芽分化，蜜蜂授粉', image: 'flower.png' },
    2: { description: '青果膨大，糖分积累', image: 'fruiting.png' },
    3: { description: '果实成熟，色泽鲜艳', image: 'ripe.png' },
    4: { description: '最佳采摘期，人工挑选', image: 'harvest.png' }
  };
  return stageMap[stage] || { description: '生长中', image: '' };
}

module.exports = { generateTraceData, getStageSpecificData };