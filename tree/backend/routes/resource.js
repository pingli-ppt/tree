const express = require('express');
const { getUserResources } = require('../controllers/resourceController');
const router = express.Router();

router.get('/', getUserResources);

module.exports = router;