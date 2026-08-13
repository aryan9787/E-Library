const Book = require('../models/Book');

class BookService {
  static async queryBooks(queryParams = {}) {
    const { search, genre, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = queryParams;

    const query = {};

    // Case-insensitive partial search on title or author
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ title: searchRegex }, { author: searchRegex }, { description: searchRegex }];
    }

    // Genre filter
    if (genre) {
      query.genre = new RegExp(`^${genre}$`, 'i');
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };

    const [books, total] = await Promise.all([
      Book.find(query).sort(sortOptions).skip(skip).limit(limitNum),
      Book.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      books,
    };
  }
}

module.exports = BookService;
