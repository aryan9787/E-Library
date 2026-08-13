const User = require('../models/User');
const Book = require('../models/Book');
const BorrowRecord = require('../models/BorrowRecord');
const asyncHandler = require('../utils/asyncHandler');

const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalBooks, borrowStats, mostBorrowed] = await Promise.all([
    User.countDocuments(),
    Book.aggregate([
      {
        $group: {
          _id: null,
          totalTitles: { $sum: 1 },
          totalCopies: { $sum: '$totalCopies' },
          availableCopies: { $sum: '$availableCopies' },
        },
      },
    ]),
    BorrowRecord.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalFines: { $sum: '$fineAmount' },
        },
      },
    ]),
    BorrowRecord.aggregate([
      {
        $group: {
          _id: '$bookId',
          borrowCount: { $sum: 1 },
        },
      },
      { $sort: { borrowCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'bookDetails',
        },
      },
      { $unwind: '$bookDetails' },
      {
        $project: {
          _id: 1,
          borrowCount: 1,
          title: '$bookDetails.title',
          author: '$bookDetails.author',
          isbn: '$bookDetails.isbn',
        },
      },
    ]),
  ]);

  const bookCounts = totalBooks[0] || { totalTitles: 0, totalCopies: 0, availableCopies: 0 };
  const borrowedCopies = bookCounts.totalCopies - bookCounts.availableCopies;

  const borrowsSummary = {
    active: 0,
    returned: 0,
    overdue: 0,
    totalFinesCollected: 0,
  };

  borrowStats.forEach((stat) => {
    if (stat._id === 'borrowed') borrowsSummary.active = stat.count;
    if (stat._id === 'returned') borrowsSummary.returned = stat.count;
    if (stat._id === 'overdue') borrowsSummary.overdue = stat.count;
    borrowsSummary.totalFinesCollected += stat.totalFines || 0;
  });

  res.status(200).json({
    success: true,
    data: {
      users: {
        totalUsers,
      },
      books: {
        totalTitles: bookCounts.totalTitles,
        totalCopies: bookCounts.totalCopies,
        availableCopies: bookCounts.availableCopies,
        borrowedCopies: Math.max(0, borrowedCopies),
      },
      borrows: borrowsSummary,
      mostBorrowedBooks: mostBorrowed,
    },
  });
});

module.exports = {
  getDashboardStats,
};
