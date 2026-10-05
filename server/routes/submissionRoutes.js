const express = require("express");
const router = express.Router();
const submissionController = require("../controllers/submissionController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { validateSubmission } = require("../middleware/validationMiddleware");
const upload = require("../middleware/uploadMiddleware");

// POST /api/submissions - Create a new safety submission (accepts up to 5 photos)
router.post(
  "/",
  authMiddleware,
  upload.array("photos", 5),
  validateSubmission,
  submissionController.createSubmission,
);

// GET /api/submissions - Get all submissions for logged-in worker
router.get("/", authMiddleware, submissionController.getMySubmissions);

// GET /api/submissions/:id - Get specific submission details
router.get("/:id", authMiddleware, submissionController.getSubmissionById);

// PUT /api/submissions/:id - Update submission
router.put("/:id", authMiddleware, submissionController.updateSubmission);

// DELETE /api/submissions/:id - Delete submission
router.delete("/:id", authMiddleware, submissionController.deleteSubmission);

module.exports = router;
