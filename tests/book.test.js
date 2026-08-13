const request = require('supertest');
const app = require('../src/app');

describe('Book Endpoints', () => {
  let adminToken;
  let userToken;
  let createdBookId;

  beforeEach(async () => {
    // Create admin user
    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'Admin User',
      email: 'admin@library.com',
      password: 'adminpassword',
      role: 'admin',
    });
    adminToken = adminRes.body.data.token;

    // Create normal user
    const userRes = await request(app).post('/api/auth/register').send({
      name: 'Normal User',
      email: 'user@library.com',
      password: 'userpassword',
      role: 'user',
    });
    userToken = userRes.body.data.token;
  });

  it('should allow admin to create a book', async () => {
    const bookData = {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      description: 'A classic story of wealth, love, and ambition in 1920s America.',
      genre: 'Classic',
      isbn: '9780743273565',
      totalCopies: 5,
      publishedYear: 1925,
    };

    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(bookData);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.book.title).toBe(bookData.title);
    expect(res.body.data.book.availableCopies).toBe(5);

    createdBookId = res.body.data.book._id;
  });

  it('should block non-admin user from creating a book', async () => {
    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Unauthorized Book',
        author: 'Unknown',
        description: 'Testing RBAC security guard',
        genre: 'Test',
        isbn: '1111111111',
        totalCopies: 1,
        publishedYear: 2020,
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should search books by title or author with pagination', async () => {
    // Create 2 books first
    await request(app).post('/api/books').set('Authorization', `Bearer ${adminToken}`).send({
      title: 'Clean Code',
      author: 'Robert C. Martin',
      description: 'A Handbook of Agile Software Craftsmanship',
      genre: 'Technology',
      isbn: '9780132350884',
      totalCopies: 3,
      publishedYear: 2008,
    });

    await request(app).post('/api/books').set('Authorization', `Bearer ${adminToken}`).send({
      title: 'Design Patterns',
      author: 'Erich Gamma',
      description: 'Elements of Reusable Object-Oriented Software',
      genre: 'Technology',
      isbn: '9780201633610',
      totalCopies: 2,
      publishedYear: 1994,
    });

    const searchRes = await request(app).get('/api/books?search=Clean&page=1&limit=10');

    expect(searchRes.statusCode).toBe(200);
    expect(searchRes.body.data.books.length).toBe(1);
    expect(searchRes.body.data.books[0].title).toBe('Clean Code');
  });
});
