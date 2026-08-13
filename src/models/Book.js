const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    genre: {
      type: String,
      required: [true, 'Genre is required'],
      trim: true,
    },
    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
    },
    totalCopies: {
      type: Number,
      required: [true, 'Total copies count is required'],
      min: [1, 'Total copies must be at least 1'],
      default: 1,
    },
    availableCopies: {
      type: Number,
      required: true,
      min: [0, 'Available copies cannot be negative'],
      default: 1,
    },
    publishedYear: {
      type: Number,
      required: [true, 'Published year is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for searching & filtering
bookSchema.index({ title: 'text', author: 'text' });
bookSchema.index({ genre: 1 });

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
