const siteService = require('../services/siteService');

class SiteController {
  async getSites(req, res, next) {
    try {
      const sites = await siteService.getActiveSites();
      res.status(200).json({ sites });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SiteController();
