const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middleware/error.middleware');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');
const ApiError = require('./utils/ApiError');

// Import routes
const authRoutes = require('./routes/auth.routes');
const bookRoutes = require('./routes/book.routes');
const borrowRoutes = require('./routes/borrow.routes');
const summaryRoutes = require('./routes/summary.routes');
const reviewRoutes = require('./routes/review.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting for general API requests
app.use('/api', apiLimiter);

// Swagger Documentation Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'E-Library System is healthy' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', summaryRoutes); // GET /api/books/:id/summary
app.use('/api/books', reviewRoutes);  // GET/POST /api/books/:id/reviews
app.use('/api/books', bookRoutes);
app.use('/api/borrow', borrowRoutes);
app.use('/api/admin', adminRoutes);

// Handle 404 routes
app.use('*', (req, res, next) => {
  next(new ApiError(404, `Cannot find route ${req.originalUrl} on this server`));
});

// Centralized Error Handling Middleware (must be last)
app.use(errorHandler);

module.exports = app;
