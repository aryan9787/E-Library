# E-Library Management System Backend

This is the backend for an E-Library Management System built with Node.js, Express, and MongoDB.

It provides APIs for users, books, borrowing, reviews, admin features, and AI-generated book summaries.

## Features

- User registration and login
- JWT authentication
- User and admin roles
- Book CRUD operations
- Search and filter books
- Borrow and return books
- Track available book copies
- Calculate late fines
- Add book ratings and reviews
- Admin dashboard
- AI book summaries
- Cache AI summaries in MongoDB
- Request validation using Zod
- API rate limiting
- Swagger API documentation
- Automated tests

## Project Structure

    e-library-backend/
    │
    ├── src/
    │   ├── config/
    │   │   ├── db.js
    │   │   └── swagger.js
    │   │
    │   ├── models/
    │   │   ├── User.js
    │   │   ├── Book.js
    │   │   ├── BorrowRecord.js
    │   │   ├── Review.js
    │   │   └── Summary.js
    │   │
    │   ├── controllers/
    │   │   ├── auth.controller.js
    │   │   ├── book.controller.js
    │   │   ├── borrow.controller.js
    │   │   ├── summary.controller.js
    │   │   ├── review.controller.js
    │   │   └── admin.controller.js
    │   │
    │   ├── routes/
    │   │   ├── auth.routes.js
    │   │   ├── book.routes.js
    │   │   ├── borrow.routes.js
    │   │   ├── summary.routes.js
    │   │   ├── review.routes.js
    │   │   └── admin.routes.js
    │   │
    │   ├── services/
    │   │   ├── ai.service.js
    │   │   ├── book.service.js
    │   │   └── borrow.service.js
    │   │
    │   ├── middleware/
    │   │   ├── auth.middleware.js
    │   │   ├── role.middleware.js
    │   │   ├── error.middleware.js
    │   │   ├── validate.middleware.js
    │   │   └── rateLimiter.middleware.js
    │   │
    │   ├── utils/
    │   │   ├── ApiError.js
    │   │   └── asyncHandler.js
    │   │
    │   ├── validators/
    │   │   ├── auth.validator.js
    │   │   ├── book.validator.js
    │   │   ├── borrow.validator.js
    │   │   └── review.validator.js
    │   │
    │   ├── app.js
    │   └── server.js
    │
    ├── tests/
    │   ├── setup.js
    │   ├── auth.test.js
    │   ├── book.test.js
    │   ├── borrow.test.js
    │   └── summary.test.js
    │
    ├── .env
    ├── .env.example
    ├── .gitignore
    ├── package.json
    └── README.md

## Environment Variables

Create a `.env` file in the project root.

    PORT=5000
    MONGO_URI=mongodb://localhost:27017/elibrary
    JWT_SECRET=your-secret-key
    JWT_EXPIRES_IN=7d

    AI_API_BASE_URL=your-ai-api-url
    AI_API_TOKEN=your-ai-api-token

    NODE_ENV=development

Keep the `.env` file private and do not commit it to GitHub.

## Running Locally

### Requirements

- Node.js 18 or higher
- MongoDB running locally or a MongoDB Atlas connection

### Install Dependencies

    npm install

### Start the Server

    npm run dev

The server will start at:

    http://localhost:5000

Swagger API documentation is available at:

    http://localhost:5000/api-docs

## AI Book Summary

The backend has an endpoint for generating a summary of a book.

When a summary is requested, the backend first checks MongoDB for an existing summary.

If the summary is already available, it is returned from the database.

If there is no existing summary, the backend calls the AI API, saves the result in MongoDB, and returns the generated summary.

This prevents making an AI API request every time the same book summary is requested.

The backend also handles common AI API errors such as invalid tokens, rate limits, and temporary network errors.

## API Endpoints

### Authentication

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |

### Books

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/books` | Public |
| GET | `/api/books/:id` | Public |
| POST | `/api/books` | Admin |
| PUT | `/api/books/:id` | Admin |
| DELETE | `/api/books/:id` | Admin |

The books endpoint supports searching, genre filtering, and pagination.

### Borrowing

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/borrow/:bookId` | Authenticated |
| POST | `/api/borrow/return/:borrowId` | Authenticated |
| GET | `/api/borrow/my-borrows` | Authenticated |

When a book is borrowed, the available copy count is reduced.

When the book is returned, the available copy count is increased.

Late returns are also checked to calculate the fine.

### AI Summary

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/books/:id/summary` | Public |

The endpoint checks the database before calling the AI service.

### Reviews

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/books/:id/reviews` | Public |
| POST | `/api/books/:id/reviews` | Authenticated |

Users can give a book a rating from 1 to 5 and add a comment.

### Admin Dashboard

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/admin/dashboard` | Admin |

The dashboard provides information such as:

- Total books
- Active borrows
- Overdue books
- Total fines
- Most borrowed books

## Important Cases

The backend handles cases such as:

- Borrowing a book when no copies are available
- Trying to borrow the same book twice
- Trying to return the same book twice
- Duplicate email addresses
- Duplicate ISBN numbers
- Unauthorized admin operations
- Case-insensitive book searches
- AI API rate limits

## Testing

The project uses Jest and Supertest for API testing.

Tests use MongoDB Memory Server, so a separate MongoDB database is not required while running the tests.

Run the tests with:

    npm test

The tests cover:

- User registration
- User login
- JWT authentication
- Book CRUD operations
- Book search
- Borrowing and returning
- Book stock updates
- Duplicate borrowing
- AI summary caching
- Error handling

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Zod
- Jest
- Supertest
- Swagger