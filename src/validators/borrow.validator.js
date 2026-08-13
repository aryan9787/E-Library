const { z } = require('zod');

const borrowBookSchema = z.object({
  params: z.object({
    bookId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Book ID format'),
  }),
});

const returnBookSchema = z.object({
  params: z.object({
    borrowId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Borrow Record ID format'),
  }),
});

module.exports = {
  borrowBookSchema,
  returnBookSchema,
};
