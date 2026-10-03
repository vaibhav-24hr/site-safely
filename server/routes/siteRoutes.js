const express = require('express');
const router = express.Router();
const siteController = require('../controllers/siteController');
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/sites (Protected)
router.get('/', authMiddleware, siteController.getSites);

module.exports = router;
