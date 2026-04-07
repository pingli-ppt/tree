// 阶段持续时间(天)
const stageDurations = [2, 2, 3, 2, 0]; // 幼苗2天，开花2天，结果3天，成熟2天，收获期瞬时
// 加速每份肥料缩短12小时(0.5天)，水滴缩短6小时(0.25天)
function calculateStage(tree) {
const now = new Date();
const stageStart = new Date(tree.stageStartAt);
let elapsedDays = (now - stageStart) / (1000 * 3600 * 24);
let currentStage = tree.stage;
let remaining = 0;
if (currentStage < 4) {
const needed = stageDurations[currentStage];
if (elapsedDays >= needed) {
// 进入下一阶段
currentStage++;
tree.stage = currentStage;
tree.stageStartAt = now;
elapsedDays = 0;
// 递归计算确保连续晋升
if (currentStage < 4) return calculateStage(tree);
} else {
remaining = needed - elapsedDays;
}
}
return { stage: tree.stage, remainingDays: remaining > 0 ? remaining : 0 };
}

function applyAccelerate(tree, hoursReduce) {
// 减少当前阶段剩余时间，通过回退stageStartAt实现
const reduceDays = hoursReduce / 24;
const newStart = new Date(tree.stageStartAt);
newStart.setDate(newStart.getDate() - reduceDays);
tree.stageStartAt = newStart;
// 重新计算阶段
return calculateStage(tree);
}

module.exports = { stageDurations, calculateStage, applyAccelerate };