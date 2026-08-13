const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyJWT } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.use(verifyJWT, authorizeRoles('admin'));

router.get('/dashboard', adminController.getDashboardStats);

module.exports = router;
