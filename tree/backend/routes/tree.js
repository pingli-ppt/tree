const express = require('express');
const { getUserTrees, accelerateTree, harvestTree, plantCustomTree, plantSeasonalTree } = require('../controllers/treeController');
const router = express.Router();

router.get('/', getUserTrees);
router.post('/accelerate', accelerateTree);
router.post('/harvest', harvestTree);
router.post('/plantCustom', plantCustomTree);
router.post('/plantSeasonal', plantSeasonalTree);

module.exports = router;