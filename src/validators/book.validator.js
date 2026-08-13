const { z } = require('zod');

const createBookSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    author: z.string().min(1, 'Author is required'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    genre: z.string().min(1, 'Genre is required'),
    isbn: z.string().min(3, 'Valid ISBN is required'),
    totalCopies: z.number().int().min(1, 'Total copies must be at least 1').optional().default(1),
    publishedYear: z.number().int().min(1000).max(new Date().getFullYear() + 1),
  }),
});

const updateBookSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    author: z.string().min(1).optional(),
    description: z.string().min(5).optional(),
    genre: z.string().min(1).optional(),
    isbn: z.string().min(3).optional(),
    totalCopies: z.number().int().min(1).optional(),
    publishedYear: z.number().int().min(1000).max(new Date().getFullYear() + 1).optional(),
  }),
});

const queryBookSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    genre: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    sortBy: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }).optional(),
});

module.exports = {
  createBookSchema,
  updateBookSchema,
  queryBookSchema,
};
