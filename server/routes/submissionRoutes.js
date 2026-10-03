const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateSubmission } = require('../middleware/validationMiddleware');

// POST /api/submissions - Create a new safety submission
router.post('/', authMiddleware, validateSubmission, submissionController.createSubmission);

// GET /api/submissions - Get all submissions for logged-in worker
router.get('/', authMiddleware, submissionController.getMySubmissions);

// GET /api/submissions/:id - Get specific submission details
router.get('/:id', authMiddleware, submissionController.getSubmissionById);

module.exports = router;
