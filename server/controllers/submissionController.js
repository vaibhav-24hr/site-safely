const submissionService = require('../services/submissionService');

class SubmissionController {
  async createSubmission(req, res, next) {
    try {
      const submission = await submissionService.createSubmission(req.user.id, req.body);
      res.status(201).json(submission);
    } catch (error) {
      next(error);
    }
  }

  async getMySubmissions(req, res, next) {
    try {
      const submissions = await submissionService.getWorkerSubmissions(req.user.id);
      res.status(200).json({ submissions });
    } catch (error) {
      next(error);
    }
  }

  async getSubmissionById(req, res, next) {
    try {
      const submission = await submissionService.getSubmissionById(
        req.params.id,
        req.user.id,
        req.user.role
      );
      res.status(200).json(submission);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SubmissionController();
