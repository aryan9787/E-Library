const BorrowService = require('../services/borrow.service');
const asyncHandler = require('../utils/asyncHandler');

const borrowBook = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const userId = req.user._id;

  const borrowRecord = await BorrowService.borrowBook(userId, bookId);

  res.status(201).json({
    success: true,
    message: 'Book borrowed successfully',
    data: { borrowRecord },
  });
});

const returnBook = asyncHandler(async (req, res) => {
  const { borrowId } = req.params;
  const userId = req.user._id;
  const isAdmin = req.user.role === 'admin';

  const borrowRecord = await BorrowService.returnBook(userId, borrowId, isAdmin);

  res.status(200).json({
    success: true,
    message: 'Book returned successfully',
    data: {
      borrowRecord,
      lateFine: borrowRecord.fineAmount > 0 ? `$${borrowRecord.fineAmount.toFixed(2)}` : '$0.00',
    },
  });
});

const getMyBorrows = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const records = await BorrowService.getUserBorrows(userId);

  res.status(200).json({
    success: true,
    data: { borrows: records },
  });
});

module.exports = {
  borrowBook,
  returnBook,
  getMyBorrows,
};
