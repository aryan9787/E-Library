# 📚 E-Library Management System Backend

A production-ready, modular Node.js/Express backend for an E-Library Management System featuring JWT-based Role-Based Access Control (RBAC), Book Inventory Management, Real-time Borrowing/Return Mechanics with stock tracking, Book Reviews, Admin Dashboard Analytics, and an **AI Book Summary Feature** designed with smart database caching and quota fail-safes.

---

## 🌟 Key Features

- **🔐 Authentication & RBAC**: Secure User Registration & Login powered by `bcryptjs` password hashing and JWT authentication (`user` and `admin` roles).
- **📖 Book Management (CRUD + Search)**:
  - Admin-only routes for adding, updating, and deleting books.
  - Public/User routes for querying books with case-insensitive partial match search on title/author/description, genre filtering, and pagination.
- **🔄 Borrowing & Return Engine**:
  - Real-time inventory tracking: automatically decrements available copies on borrow and increments on return.
  - Edge case guardrails: prevents borrowing when copies reach 0, prevents duplicate active borrows of the same book, and prevents returning a book twice.
  - Dynamic overdue late fee calculation ($1.00 / overdue day).
- **🤖 AI Book Summary Feature (Smart Cache Layer)**:
  - Conserves external AI API call quotas by caching generated summaries in MongoDB (`Summary` collection).
  - Subsequent requests for the same book ID return immediately from cache (`source: "cache"`).
  - Graceful degradation: handles quota exhaustion (`429`) with HTTP `503 Service Unavailable` and handles auth errors (`401`) without exposing API keys.
- **⭐ Book Reviews & Ratings**: Users can leave 1-5 star ratings and comments per book.
- **📊 Admin Dashboard Analytics**: Consolidated metrics for total books, active borrows, overdue counts, total fines collected, and Top 5 Most Borrowed books.
- **🛡️ Validation & Rate Limiting**: Zod schema validation middleware and `express-rate-limit` guards against brute-force and DDoS attempts.
- **📄 Interactive OpenAPI/Swagger Docs**: Live interactive API documentation at `/api-docs`.
- **🧪 Comprehensive Automated Testing**: Isolated test suite powered by Jest & Supertest using `mongodb-memory-server`.

---

## 📂 Project Structure

```
e-library-backend/
├── src/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection & error logging
│   │   └── swagger.js            # Swagger/OpenAPI documentation configuration
│   ├── models/
│   │   ├── User.js               # User model with role & bcrypt hashing
│   │   ├── Book.js               # Book model with inventory stock & text indexes
│   │   ├── BorrowRecord.js       # Borrow transaction record & status
│   │   ├── Review.js             # User reviews and rating scores
│   │   └── Summary.js            # Cached AI book summaries
│   ├── controllers/
│   │   ├── auth.controller.js    # Register, login, get current user
│   │   ├── book.controller.js    # Book CRUD, search & stats
│   │   ├── borrow.controller.js  # Borrow, return & borrow history
│   │   ├── summary.controller.js # AI summary endpoint
│   │   ├── review.controller.js  # Review creation & retrieval
│   │   └── admin.controller.js   # Admin metrics & analytics dashboard
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── book.routes.js
│   │   ├── borrow.routes.js
│   │   ├── summary.routes.js
│   │   ├── review.routes.js
│   │   └── admin.routes.js
│   ├── services/
│   │   ├── ai.service.js         # External AI API integration with retry & caching logic
│   │   ├── book.service.js       # Book query filtering & pagination helper
│   │   └── borrow.service.js     # Borrowing business logic & fine calculation
│   ├── middleware/
│   │   ├── auth.middleware.js    # JWT verification & req.user attachment
│   │   ├── role.middleware.js    # Role authorization guard (e.g. admin)
│   │   ├── error.middleware.js   # Centralized error handler
│   │   ├── validate.middleware.js# Zod schema validation middleware
│   │   └── rateLimiter.middleware.js # Express rate limiters
│   ├── utils/
│   │   ├── ApiError.js           # Custom operational error class
│   │   └── asyncHandler.js       # Async wrapper for clean controllers
│   ├── validators/
│   │   ├── auth.validator.js     # Zod schemas for authentication
│   │   ├── book.validator.js     # Zod schemas for book operations
│   │   ├── borrow.validator.js   # Zod schemas for borrowing/returning
│   │   └── review.validator.js   # Zod schemas for reviews
│   ├── app.js                    # Express app initialization & route assembly
│   └── server.js                 # Application entrypoint
├── tests/
│   ├── setup.js                  # In-memory MongoDB environment setup
│   ├── auth.test.js              # Auth endpoints tests
│   ├── book.test.js              # Book CRUD & search tests
│   ├── borrow.test.js            # Borrow & Return mechanics tests
│   └── summary.test.js           # AI Summary cache & error handling tests
├── .env                          # Local secrets (gitignored)
├── .env.example                  # Secret key template
├── .gitignore
├── Dockerfile                    # Production Docker container definition
├── package.json
└── README.md
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/elibrary
JWT_SECRET=super-secret-jwt-key-for-elibrary-system
JWT_EXPIRES_IN=7d
AI_API_BASE_URL=https://ai-api.userfacet.com
AI_API_TOKEN=sk-10a14ea7ac9f41548984d40d8f73fd91
NODE_ENV=development
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js (v18+)
- MongoDB (local instance running on `27017` or MongoDB Atlas connection string)

### Steps
1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The server will start at `http://localhost:5000`.

3. **Interactive API Documentation**:
   Open `http://localhost:5000/api-docs` in your browser to view the interactive Swagger API documentation.

### Containerized Setup with Docker
```bash
docker build -t e-library-backend .
docker run -p 5000:5000 --env-file .env e-library-backend
```

---

## 🧠 AI Book Summary & Quota Optimization Strategy

To operate strictly within external AI API quota constraints (e.g. 100 API call limit):

1. **Database Caching Layer**:
   When `GET /api/books/:id/summary` is requested:
   - The system checks the `Summary` collection for `bookId`.
   - **Cache Hit**: Returns the existing cached summary immediately with `"source": "cache"`. Zero API requests are made.
   - **Cache Miss**: Calls external AI API (`/v1/chat/completions`) with `max_tokens: 300`, saves the response to `Summary` collection, and returns with `"source": "generated"`.

2. **Fail-Safe & Graceful Degradation**:
   - **401 Invalid Token**: Logged internally for debugging without leaking tokens to clients. Returns `500 Internal Server Error`.
   - **429 Rate Limit / Quota Exhaustion**: Maps to HTTP `503 Service Unavailable` with a user-friendly error message, ensuring the main application remains stable.
   - **Transient Network Errors**: Retries network requests once before returning a clean `502 Bad Gateway`.

---

## 📡 API Endpoints Overview

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user (`user` or `admin` role) |
| `POST` | `/api/auth/login` | Public | Login & receive JWT access token |
| `GET` | `/api/auth/me` | Authenticated | Get current authenticated user details |

### Books (`/api/books`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/books` | Public | Query books (search, filter by genre, pagination) |
| `GET` | `/api/books/:id` | Public | Get detailed book info & aggregate rating stats |
| `POST` | `/api/books` | Admin | Create a new book |
| `PUT` | `/api/books/:id` | Admin | Update an existing book |
| `DELETE` | `/api/books/:id` | Admin | Delete a book |

### Borrowing (`/api/borrow`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/borrow/:bookId` | Authenticated | Borrow a book (stock must be > 0) |
| `POST` | `/api/borrow/return/:borrowId` | Authenticated | Return a borrowed book & compute fines |
| `GET` | `/api/borrow/my-borrows` | Authenticated | View active and past borrow records |

### AI Summary (`/api/books/:id/summary`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/books/:id/summary` | Public | Get AI book summary (checks cache first) |

### Reviews (`/api/books/:id/reviews`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/books/:id/reviews` | Public | Get user reviews for a book |
| `POST` | `/api/books/:id/reviews` | Authenticated | Submit rating (1-5) and comment for a book |

### Admin Dashboard (`/api/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | Admin | System metrics, active borrows & Top 5 books |

---

## 🛡️ Edge Cases Explicitly Handled

1. **Zero Stock Borrowing**: Attempting to borrow a book with `availableCopies = 0` returns `409 Conflict`.
2. **Duplicate Active Borrow**: Users cannot borrow the same book twice simultaneously (`400 Bad Request`).
3. **Double Return Prevention**: Attempting to return an already returned borrow record returns `400 Bad Request`.
4. **Duplicate Email / ISBN**: Unique database indexes prevent duplicate emails on registration and duplicate ISBNs on book creation (`409 Conflict`).
5. **Role Security (RBAC)**: Non-admin users attempting to invoke book creation/update/delete or admin dashboard endpoints are rejected with `403 Forbidden`.
6. **Case-Insensitive Search & Pagination**: Search queries handle partial case-insensitive matches across title, author, and description with configurable page limits.
7. **AI Quota Exhaustion**: API rate limit errors (429) degrade gracefully into a `503 Service Unavailable` response.

---

## 🧪 Running Automated Tests

Tests run in complete isolation using an in-memory MongoDB server (`mongodb-memory-server`), requiring no local database configuration.

```bash
npm test
```

Test coverage includes:
- Authentication & JWT token validation
- Book CRUD, Role-based guardrails, and query pagination
- Borrowing stock updates, duplicate borrow guards, and return mechanics
- AI Summary cache hits (`source: "cache"`) and error status handling
