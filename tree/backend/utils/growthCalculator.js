// 阶段持续时间(天)
// 总成长天数: 8+8+8+6 = 30天
const stageDurations = [8, 8, 8, 6, 0]; // 幼苗8天，开花8天，结果8天，成熟6天，收获期瞬时

// 加速每份肥料缩短12小时(0.5天)，水滴缩短6小时(0.25天)
function calculateStage(tree) {
    const now = new Date();
    // 使用 plantedAt 作为基准，而不是 stageStartAt
    const plantedAt = new Date(tree.plantedAt);
    const totalDaysPassed = (now - plantedAt) / (1000 * 3600 * 24);
    
    let accumulatedDays = 0;
    let currentStage = 0;
    
    // 根据总经过天数确定当前阶段
    for (let i = 0; i < stageDurations.length - 1; i++) {
        if (totalDaysPassed < accumulatedDays + stageDurations[i]) {
            currentStage = i;
            break;
        }
        accumulatedDays += stageDurations[i];
        currentStage = i + 1;
    }
    
    // 如果已经超过总天数，设置为收获期
    if (currentStage >= stageDurations.length - 1) {
        currentStage = 4;
    }
    
    // 更新树的阶段
    tree.stage = currentStage;
    
    // 计算当前阶段剩余天数
    let remainingDays = 0;
    if (currentStage < 4) {
        const stageElapsed = totalDaysPassed - accumulatedDays;
        remainingDays = Math.max(0, stageDurations[currentStage] - stageElapsed);
    }
    
    return { stage: currentStage, remainingDays: remainingDays };
}

function applyAccelerate(tree, hoursReduce) {
    // 通过将 plantedAt 提前来实现加速
    const newPlantedAt = new Date(tree.plantedAt);
    newPlantedAt.setHours(newPlantedAt.getHours() - hoursReduce);
    tree.plantedAt = newPlantedAt;
    
    // 重新计算阶段
    return calculateStage(tree);
}

module.exports = { stageDurations, calculateStage, applyAccelerate };