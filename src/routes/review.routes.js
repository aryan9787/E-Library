const express = require('express');
const router = express.Router({ mergeParams: true });
const reviewController = require('../controllers/review.controller');
const validate = require('../middleware/validate.middleware');
const { verifyJWT } = require('../middleware/auth.middleware');
const { createReviewSchema } = require('../validators/review.validator');

router
  .route('/:id/reviews')
  .get(reviewController.getReviewsByBook)
  .post(verifyJWT, validate(createReviewSchema), reviewController.addReview);

module.exports = router;
