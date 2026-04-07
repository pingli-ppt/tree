const express = require('express');
const { getDailyTip, searchKnowledge, getQuizQuestion } = require('../controllers/nutritionController');
const router = express.Router();

router.get('/tip', getDailyTip);
router.get('/search', searchKnowledge);
router.get('/quiz', getQuizQuestion);

module.exports = router;