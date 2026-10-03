const adminService = require('../services/adminService');

class AdminController {
  async getSummary(req, res, next) {
    try {
      const summary = await adminService.getAdminSummary();
      res.status(200).json(summary);
    } catch (error) {
      next(error);
    }
  }

  async getSubmissions(req, res, next) {
    try {
      const { site_id, worker_id, date } = req.query;
      const submissions = await adminService.getAdminSubmissions({
        site_id,
        worker_id,
        date
      });
      res.status(200).json({ submissions });
    } catch (error) {
      next(error);
    }
  }

  async getSubmissionById(req, res, next) {
    try {
      const submission = await adminService.getAdminSubmissionById(req.params.id);
      res.status(200).json(submission);
    } catch (error) {
      next(error);
    }
  }

  async getMissingWorkers(req, res, next) {
    try {
      const { site_id } = req.query;
      const result = await adminService.getMissingWorkers(site_id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
