const Book = require('../models/Book');
const Review = require('../models/Review');
const BookService = require('../services/book.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const createBook = asyncHandler(async (req, res) => {
  const { title, author, description, genre, isbn, totalCopies, publishedYear } = req.body;

  const existingBook = await Book.findOne({ isbn });
  if (existingBook) {
    throw new ApiError(409, `Book with ISBN '${isbn}' already exists.`);
  }

  const book = await Book.create({
    title,
    author,
    description,
    genre,
    isbn,
    totalCopies: totalCopies || 1,
    availableCopies: totalCopies || 1,
    publishedYear,
  });

  res.status(201).json({
    success: true,
    message: 'Book created successfully',
    data: { book },
  });
});

const getBooks = asyncHandler(async (req, res) => {
  const result = await BookService.queryBooks(req.query);

  res.status(200).json({
    success: true,
    message: 'Books retrieved successfully',
    data: result,
  });
});

const getBookById = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    throw new ApiError(404, 'Book not found');
  }

  // Aggregate average review rating and review count
  const reviews = await Review.find({ bookId: book._id }).populate('userId', 'name');
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : 0;

  res.status(200).json({
    success: true,
    data: {
      book,
      stats: {
        totalReviews,
        avgRating: Number(avgRating),
      },
      reviews,
    },
  });
});

const updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    throw new ApiError(404, 'Book not found');
  }

  // Check ISBN uniqueness if updated
  if (req.body.isbn && req.body.isbn !== book.isbn) {
    const existingBook = await Book.findOne({ isbn: req.body.isbn });
    if (existingBook) {
      throw new ApiError(409, `Another book with ISBN '${req.body.isbn}' already exists.`);
    }
  }

  // Adjust availableCopies if totalCopies changes
  if (req.body.totalCopies !== undefined) {
    const diff = req.body.totalCopies - book.totalCopies;
    const newAvailable = book.availableCopies + diff;
    if (newAvailable < 0) {
      throw new ApiError(400, 'Cannot reduce total copies below currently borrowed copies count');
    }
    book.availableCopies = newAvailable;
    book.totalCopies = req.body.totalCopies;
  }

  Object.assign(book, req.body);
  await book.save();

  res.status(200).json({
    success: true,
    message: 'Book updated successfully',
    data: { book },
  });
});

const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    throw new ApiError(404, 'Book not found');
  }

  await book.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Book deleted successfully',
  });
});

module.exports = {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
};
