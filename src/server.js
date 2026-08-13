require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Start Server after connecting to MongoDB
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[Server] E-Library backend running on http://localhost:${PORT}`);
      console.log(`[Swagger] API Docs available at http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((err) => {
    console.error(`[Server] Failed to start server: ${err.message}`);
  });
