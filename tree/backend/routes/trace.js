const express = require('express');
const { getTreeTrace } = require('../controllers/traceController');
const router = express.Router();

router.get('/tree/:treeId', getTreeTrace);

module.exports = router;