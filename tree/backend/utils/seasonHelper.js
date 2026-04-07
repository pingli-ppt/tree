function getCurrentSeason() {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

function getSeasonalTreeType() {
  const season = getCurrentSeason();
  const map = {
    spring: 'cherry',   // 樱桃树
    summer: 'peach',    // 桃子树
    autumn: 'pear',     // 梨枣树
    winter: 'orange'    // 橙子树
  };
  return map[season];
}

function getSeasonalProductName() {
  const season = getCurrentSeason();
  const map = {
    spring: '春日樱桃果泥',
    summer: '夏蜜桃果泥',
    autumn: '秋梨枣果泥',
    winter: '冬甜橙果泥'
  };
  return map[season];
}

module.exports = { getCurrentSeason, getSeasonalTreeType, getSeasonalProductName };