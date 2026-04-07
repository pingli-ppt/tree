const FruitTree = require('../models/FruitTree');
const { generateTraceData, getStageSpecificData } = require('../utils/blockchainMock');

exports.getTreeTrace = async (req, res) => {
  try {
    const tree = await FruitTree.findById(req.params.treeId);
    if (!tree) return res.status(404).json({ error: '果树不存在' });
    const trace = generateTraceData(tree.treeType, tree.stage);
    const stageInfo = getStageSpecificData(tree.stage, tree.treeType);
    res.json({ trace, stageInfo, blockchainHash: trace.blockHash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};