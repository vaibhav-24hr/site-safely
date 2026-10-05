const { supabaseAdmin } = require("../db/supabaseClient");

/**
 * Site Service
 * Manages construction job sites.
 */
class SiteService {
  /**
   * Get all active job sites
   */
  async getActiveSites() {
    const { data: sites, error } = await supabaseAdmin
      .from("sites")
      .select("id, name, address, active, created_at")
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching sites:", error);
      const err = new Error("Failed to retrieve job sites");
      err.status = 500;
      throw err;
    }

    return sites || [];
  }
}

module.exports = new SiteService();
