const { z } = require('zod');

const createReviewSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Book ID format'),
  }),
  body: z.object({
    rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
    comment: z.string().min(2, 'Comment must be at least 2 characters'),
  }),
});

module.exports = {
  createReviewSchema,
};
