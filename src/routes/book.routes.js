const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
const validate = require('../middleware/validate.middleware');
const { verifyJWT } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const { createBookSchema, updateBookSchema, queryBookSchema } = require('../validators/book.validator');

router
  .route('/')
  .get(validate(queryBookSchema), bookController.getBooks)
  .post(verifyJWT, authorizeRoles('admin'), validate(createBookSchema), bookController.createBook);

router
  .route('/:id')
  .get(bookController.getBookById)
  .put(verifyJWT, authorizeRoles('admin'), validate(updateBookSchema), bookController.updateBook)
  .delete(verifyJWT, authorizeRoles('admin'), bookController.deleteBook);

module.exports = router;
