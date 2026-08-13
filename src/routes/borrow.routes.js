const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrow.controller');
const validate = require('../middleware/validate.middleware');
const { verifyJWT } = require('../middleware/auth.middleware');
const { borrowBookSchema, returnBookSchema } = require('../validators/borrow.validator');

router.use(verifyJWT);

router.post('/return/:borrowId', validate(returnBookSchema), borrowController.returnBook);
router.post('/:bookId', validate(borrowBookSchema), borrowController.borrowBook);
router.get('/my-borrows', borrowController.getMyBorrows);

module.exports = router;
