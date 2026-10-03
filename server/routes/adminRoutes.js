const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// Protect all admin routes with authentication AND admin role authorization
router.use(authMiddleware, adminMiddleware);

// GET /api/admin/summary - Top-level dashboard summary cards
router.get('/summary', adminController.getSummary);

// GET /api/admin/submissions - Filterable list of all submissions
router.get('/submissions', adminController.getSubmissions);

// GET /api/admin/submissions/:id - Full submission detail inspection
router.get('/submissions/:id', adminController.getSubmissionById);

// GET /api/admin/missing-workers - Who hasn't submitted today
router.get('/missing-workers', adminController.getMissingWorkers);

module.exports = router;
