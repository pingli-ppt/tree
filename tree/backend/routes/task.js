const express = require('express');
const { getDailyTasks, completeDailyTask, getGrowthTasks, completeGrowthTask } = require('../controllers/taskController');
const router = express.Router();

router.get('/daily', getDailyTasks);
router.post('/completeDaily', completeDailyTask);
router.get('/growth', getGrowthTasks);
router.post('/completeGrowth', completeGrowthTask);

module.exports = router;