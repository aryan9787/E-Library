const Review = require('../models/Review');
const Book = require('../models/Book');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const addReview = asyncHandler(async (req, res) => {
  const { id: bookId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  const book = await Book.findById(bookId);
  if (!book) {
    throw new ApiError(404, 'Book not found');
  }

  // Check if user already reviewed this book
  const existingReview = await Review.findOne({ userId, bookId });
  if (existingReview) {
    throw new ApiError(400, 'You have already submitted a review for this book.');
  }

  const review = await Review.create({
    userId,
    bookId,
    rating,
    comment,
  });

  await review.populate('userId', 'name');

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    data: { review },
  });
});

const getReviewsByBook = asyncHandler(async (req, res) => {
  const { id: bookId } = req.params;

  const book = await Book.findById(bookId);
  if (!book) {
    throw new ApiError(404, 'Book not found');
  }

  const reviews = await Review.find({ bookId })
    .populate('userId', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: { reviews },
  });
});

module.exports = {
  addReview,
  getReviewsByBook,
};
