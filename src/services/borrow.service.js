const BorrowRecord = require('../models/BorrowRecord');
const Book = require('../models/Book');
const ApiError = require('../utils/ApiError');

class BorrowService {
  /**
   * Process borrowing a book for a user.
   */
  static async borrowBook(userId, bookId) {
    const book = await Book.findById(bookId);

    if (!book) {
      throw new ApiError(404, 'Book not found');
    }

    // Edge Case: Prevent borrowing when 0 copies available
    if (book.availableCopies <= 0) {
      throw new ApiError(409, `Cannot borrow '${book.title}'. 0 available copies in stock.`);
    }

    // Edge Case: Prevent duplicate active borrow of same book by same user
    const existingBorrow = await BorrowRecord.findOne({
      userId,
      bookId,
      status: 'borrowed',
    });

    if (existingBorrow) {
      throw new ApiError(400, `You have already borrowed '${book.title}' and have not returned it yet.`);
    }

    // Create borrow record (due in 14 days)
    const borrowedAt = new Date();
    const dueAt = new Date(borrowedAt.getTime() + 14 * 24 * 60 * 60 * 1000);

    const borrowRecord = await BorrowRecord.create({
      userId,
      bookId,
      borrowedAt,
      dueAt,
      status: 'borrowed',
    });

    // Atomically decrement available copies
    book.availableCopies -= 1;
    await book.save();

    return borrowRecord;
  }

  /**
   * Process returning a borrowed book.
   */
  static async returnBook(userId, borrowId, isAdmin = false) {
    const borrowRecord = await BorrowRecord.findById(borrowId).populate('bookId');

    if (!borrowRecord) {
      throw new ApiError(404, 'Borrow record not found');
    }

    // Verify ownership unless admin
    if (!isAdmin && borrowRecord.userId.toString() !== userId.toString()) {
      throw new ApiError(403, 'Access denied. You can only return your own borrowed books.');
    }

    // Edge Case: Return a book twice
    if (borrowRecord.status === 'returned') {
      throw new ApiError(400, 'This book has already been returned.');
    }

    const now = new Date();
    let fineAmount = 0;

    // Compute late return fine ($1 per overdue day)
    if (now > borrowRecord.dueAt) {
      const diffMs = now.getTime() - borrowRecord.dueAt.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      fineAmount = diffDays * 1.0;
    }

    borrowRecord.returnedAt = now;
    borrowRecord.status = 'returned';
    borrowRecord.fineAmount = fineAmount;
    await borrowRecord.save();

    // Increment available copies back
    const book = await Book.findById(borrowRecord.bookId._id || borrowRecord.bookId);
    if (book) {
      book.availableCopies += 1;
      await book.save();
    }

    return borrowRecord;
  }

  /**
   * Get all active and past borrows for a user.
   */
  static async getUserBorrows(userId) {
    const records = await BorrowRecord.find({ userId })
      .populate('bookId', 'title author isbn genre')
      .sort({ createdAt: -1 });

    const now = new Date();
    const updatedRecords = records.map((record) => {
      const rec = record.toObject();
      if (rec.status === 'borrowed' && now > rec.dueAt) {
        rec.status = 'overdue';
        const diffMs = now.getTime() - new Date(rec.dueAt).getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        rec.fineAmount = diffDays * 1.0;
      }
      return rec;
    });

    return updatedRecords;
  }
}

module.exports = BorrowService;
