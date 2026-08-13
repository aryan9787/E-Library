const request = require('supertest');
const app = require('../src/app');
const Summary = require('../src/models/Summary');

describe('AI Book Summary & Caching Layer', () => {
  let adminToken;
  let bookId;

  beforeEach(async () => {
    // Admin login
    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'Summary Admin',
      email: 'sumadmin@library.com',
      password: 'adminpassword',
      role: 'admin',
    });
    adminToken = adminRes.body.data.token;

    // Create book
    const b = await request(app).post('/api/books').set('Authorization', `Bearer ${adminToken}`).send({
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      description: 'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it.',
      genre: 'Classic',
      isbn: '9780061120084',
      totalCopies: 5,
      publishedYear: 1960,
    });
    bookId = b.body.data.book._id;
  });

  it('should hit cache on second call to GET /api/books/:id/summary', async () => {
    // Pre-seed a summary in the cache
    await Summary.create({
      bookId,
      summaryText: 'Pre-cached summary for To Kill a Mockingbird test.',
      source: 'generated',
    });

    // Call summary endpoint
    const res = await request(app).get(`/api/books/${bookId}/summary`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.source).toBe('cache');
    expect(res.body.data.summary).toBe('Pre-cached summary for To Kill a Mockingbird test.');
  });

  it('should return 404 if summary requested for non-existent book ID', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await request(app).get(`/api/books/${fakeId}/summary`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
