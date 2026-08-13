const Book = require('../models/Book');
const AIService = require('../services/ai.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const getBookSummary = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const book = await Book.findById(id);

  if (!book) {
    throw new ApiError(404, 'Book not found');
  }

  const summaryResult = await AIService.getBookSummary(book);

  res.status(200).json({
    success: true,
    message: summaryResult.source === 'cache'
      ? 'Book summary retrieved from cache'
      : 'Book summary generated successfully via AI',
    data: summaryResult,
  });
});

module.exports = {
  getBookSummary,
};
