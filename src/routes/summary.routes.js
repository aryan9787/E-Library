const express = require('express');
const router = express.Router({ mergeParams: true });
const summaryController = require('../controllers/summary.controller');
const { summaryLimiter } = require('../middleware/rateLimiter.middleware');

router.get('/:id/summary', summaryLimiter, summaryController.getBookSummary);

module.exports = router;
