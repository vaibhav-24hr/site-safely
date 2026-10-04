/**
 * Submission Validation Middleware
 * Validates the safety form input before it reaches the service layer.
 */
function validateSubmission(req, res, next) {
  const { site_id } = req.body;

  if (!site_id || typeof site_id !== 'string' || site_id.trim() === '') {
    return res.status(400).json({
      error: 'Job site selection (site_id) is required',
      status: 400
    });
  }

  const checklistFields = [
    'ppe_hard_hat',
    'ppe_vest',
    'ppe_boots',
    'ppe_eye_protection',
    'fall_protection',
    'ladders_scaffolding',
    'tools_cords',
    'hazards_identified'
  ];

  for (const field of checklistFields) {
    let val = req.body[field];

    // Convert string 'true'/'false' from FormData back to boolean
    if (val === 'true') val = true;
    if (val === 'false') val = false;
    
    // Write back to req.body so controllers have the boolean value
    req.body[field] = val;

    if (val === undefined || val === null) {
      return res.status(400).json({
        error: `Checklist item '${field}' is required and must be a boolean`,
        status: 400
      });
    }

    if (typeof val !== 'boolean') {
      return res.status(400).json({
        error: `Field '${field}' must be a boolean (true or false)`,
        status: 400
      });
    }
  }

  if (req.body.notes !== undefined && req.body.notes !== null && typeof req.body.notes !== 'string') {
    return res.status(400).json({
      error: 'Notes field must be text',
      status: 400
    });
  }

  next();
}

/**
 * Photo Upload Limits Configuration
 */
const PHOTO_UPLOAD_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
};

module.exports = {
  validateSubmission,
  PHOTO_UPLOAD_CONFIG
};
