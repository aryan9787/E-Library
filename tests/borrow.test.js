const request = require('supertest');
const app = require('../src/app');

describe('Borrowing & Return Mechanics', () => {
  let adminToken;
  let userToken;
  let singleCopyBookId;
  let multiCopyBookId;

  beforeEach(async () => {
    // Register Admin
    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'Librarian Admin',
      email: 'librarian@library.com',
      password: 'adminpassword',
      role: 'admin',
    });
    adminToken = adminRes.body.data.token;

    // Register User
    const userRes = await request(app).post('/api/auth/register').send({
      name: 'Book Reader',
      email: 'reader@library.com',
      password: 'readerpassword',
      role: 'user',
    });
    userToken = userRes.body.data.token;

    // Create 1-copy book
    const b1 = await request(app).post('/api/books').set('Authorization', `Bearer ${adminToken}`).send({
      title: 'Rare Manuscript',
      author: 'Historical Author',
      description: 'Extremely rare single copy book in the library.',
      genre: 'History',
      isbn: '9780000000001',
      totalCopies: 1,
      publishedYear: 1800,
    });
    singleCopyBookId = b1.body.data.book._id;

    // Create 2-copy book
    const b2 = await request(app).post('/api/books').set('Authorization', `Bearer ${adminToken}`).send({
      title: 'Popular Fiction',
      author: 'Famous Author',
      description: 'Popular fiction available in 2 copies.',
      genre: 'Fiction',
      isbn: '9780000000002',
      totalCopies: 2,
      publishedYear: 2021,
    });
    multiCopyBookId = b2.body.data.book._id;
  });

  it('should allow user to borrow a book with stock available', async () => {
    const res = await request(app)
      .post(`/api/borrow/${multiCopyBookId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.borrowRecord.status).toBe('borrowed');

    // Verify stock decreased
    const bookRes = await request(app).get(`/api/books/${multiCopyBookId}`);
    expect(bookRes.body.data.book.availableCopies).toBe(1);
  });

  it('should prevent borrowing when 0 copies available', async () => {
    // First user borrows the single copy
    await request(app)
      .post(`/api/borrow/${singleCopyBookId}`)
      .set('Authorization', `Bearer ${userToken}`);

    // Second user attempts to borrow the same single copy
    const user2Res = await request(app).post('/api/auth/register').send({
      name: 'Second Reader',
      email: 'reader2@library.com',
      password: 'password123',
    });
    const user2Token = user2Res.body.data.token;

    const borrowAttempt = await request(app)
      .post(`/api/borrow/${singleCopyBookId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(borrowAttempt.statusCode).toBe(409);
    expect(borrowAttempt.body.success).toBe(false);
    expect(borrowAttempt.body.message).toContain('0 available copies');
  });

  it('should prevent user from borrowing the same book twice simultaneously', async () => {
    await request(app)
      .post(`/api/borrow/${multiCopyBookId}`)
      .set('Authorization', `Bearer ${userToken}`);

    const secondAttempt = await request(app)
      .post(`/api/borrow/${multiCopyBookId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(secondAttempt.statusCode).toBe(400);
    expect(secondAttempt.body.message).toContain('already borrowed');
  });

  it('should allow user to return a book and replenish stock', async () => {
    const borrowRes = await request(app)
      .post(`/api/borrow/${multiCopyBookId}`)
      .set('Authorization', `Bearer ${userToken}`);

    const borrowId = borrowRes.body.data.borrowRecord._id;

    const returnRes = await request(app)
      .post(`/api/borrow/return/${borrowId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(returnRes.statusCode).toBe(200);
    expect(returnRes.body.data.borrowRecord.status).toBe('returned');

    // Verify stock restored
    const bookRes = await request(app).get(`/api/books/${multiCopyBookId}`);
    expect(bookRes.body.data.book.availableCopies).toBe(2);
  });

  it('should prevent returning the same borrow record twice', async () => {
    const borrowRes = await request(app)
      .post(`/api/borrow/${multiCopyBookId}`)
      .set('Authorization', `Bearer ${userToken}`);

    const borrowId = borrowRes.body.data.borrowRecord._id;

    await request(app)
      .post(`/api/borrow/return/${borrowId}`)
      .set('Authorization', `Bearer ${userToken}`);

    const secondReturnRes = await request(app)
      .post(`/api/borrow/return/${borrowId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(secondReturnRes.statusCode).toBe(400);
    expect(secondReturnRes.body.message).toContain('already been returned');
  });
});
