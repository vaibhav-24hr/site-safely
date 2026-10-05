const { supabaseAdmin } = require("../db/supabaseClient");

/**
 * Admin Service
 * Business logic for admin dashboard, analytics, multi-factor filtering,
 * and tracking workers who haven't completed their daily safety form.
 */
class AdminService {
  /**
   * Get summary dashboard statistics
   */
  async getAdminSummary() {
    const today = new Date().toISOString().split("T")[0];

    // 1. Today's submissions count
    const { count: todaysSubmissions, error: subError } = await supabaseAdmin
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .eq("submission_date", today);

    // 2. Active sites count
    const { count: activeSites, error: sitesError } = await supabaseAdmin
      .from("sites")
      .select("*", { count: "exact", head: true })
      .eq("active", true);

    // 3. Total workers count (role = framer)
    const { count: totalWorkers, error: workersError } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "framer");

    if (subError || sitesError || workersError) {
      console.error("Error fetching admin summary stats:", {
        subError,
        sitesError,
        workersError,
      });
    }

    // 4. Calculate missing submissions for today
    const missingData = await this.getMissingWorkers();
    let missingCount = 0;
    if (missingData && missingData.sites) {
      missingData.sites.forEach((site) => {
        missingCount += site.workers.filter((w) => !w.submitted).length;
      });
    }

    return {
      todays_submissions: todaysSubmissions || 0,
      active_sites: activeSites || 0,
      total_workers: totalWorkers || 0,
      missing_submissions: missingCount,
    };
  }

  /**
   * Get submissions with optional multi-factor filtering (site, worker, date)
   */
  async getAdminSubmissions(filters = {}) {
    const { site_id, worker_id, date } = filters;

    let query = supabaseAdmin.from("submissions").select(`
        id,
        user_id,
        site_id,
        submission_date,
        ppe_hard_hat,
        ppe_vest,
        ppe_boots,
        ppe_eye_protection,
        fall_protection,
        ladders_scaffolding,
        tools_cords,
        hazards_identified,
        notes,
        created_at,
        worker:users(id, full_name, email),
        site:sites(id, name, address),
        photos(id)
      `);

    if (site_id) {
      query = query.eq("site_id", site_id);
    }

    if (worker_id) {
      query = query.eq("user_id", worker_id);
    }

    if (date) {
      query = query.eq("submission_date", date);
    }

    query = query.order("created_at", { ascending: false });

    const { data: submissions, error } = await query;

    if (error) {
      console.error("Error fetching admin submissions:", error);
      const err = new Error("Failed to retrieve submissions");
      err.status = 500;
      throw err;
    }

    return (submissions || []).map((sub) => ({
      id: sub.id,
      user_id: sub.user_id,
      worker_name: sub.worker?.full_name || "Unknown Worker",
      worker_email: sub.worker?.email || "",
      site_id: sub.site_id,
      site_name: sub.site?.name || "Unknown Site",
      submission_date: sub.submission_date,
      created_at: sub.created_at,
      ppe_hard_hat: sub.ppe_hard_hat,
      ppe_vest: sub.ppe_vest,
      ppe_boots: sub.ppe_boots,
      ppe_eye_protection: sub.ppe_eye_protection,
      fall_protection: sub.fall_protection,
      ladders_scaffolding: sub.ladders_scaffolding,
      tools_cords: sub.tools_cords,
      hazards_identified: sub.hazards_identified,
      all_safe: Boolean(
        sub.ppe_hard_hat &&
        sub.ppe_vest &&
        sub.ppe_boots &&
        sub.ppe_eye_protection &&
        sub.fall_protection &&
        sub.ladders_scaffolding &&
        sub.tools_cords &&
        sub.hazards_identified,
      ),
      notes: sub.notes,
      photo_count: sub.photos ? sub.photos.length : 0,
    }));
  }

  /**
   * Get single submission details for admin view
   */
  async getAdminSubmissionById(submissionId) {
    const { data: submission, error } = await supabaseAdmin
      .from("submissions")
      .select(
        `
        *,
        worker:users(id, full_name, email, role),
        site:sites(id, name, address),
        photos(id, url, file_name, file_type, file_size, created_at)
      `,
      )
      .eq("id", submissionId)
      .single();

    if (error || !submission) {
      const notFound = new Error("Submission not found");
      notFound.status = 404;
      throw notFound;
    }

    return {
      ...submission,
      all_safe: Boolean(
        submission.ppe_hard_hat &&
        submission.ppe_vest &&
        submission.ppe_boots &&
        submission.ppe_eye_protection &&
        submission.fall_protection &&
        submission.ladders_scaffolding &&
        submission.tools_cords &&
        submission.hazards_identified,
      ),
    };
  }

  /**
   * "Who Hasn't Submitted Today?"
   * Groups active sites and matches expected workers against today's safety submissions.
   */
  async getMissingWorkers(siteIdFilter = null) {
    const today = new Date().toISOString().split("T")[0];

    // 1. Fetch active sites
    let sitesQuery = supabaseAdmin
      .from("sites")
      .select("id, name, address")
      .eq("active", true);

    if (siteIdFilter) {
      sitesQuery = sitesQuery.eq("id", siteIdFilter);
    }

    const { data: activeSites, error: sitesErr } = await sitesQuery.order(
      "name",
      { ascending: true },
    );
    if (sitesErr) throw sitesErr;

    // 2. Fetch all workers (role = framer)
    const { data: workers, error: workersErr } = await supabaseAdmin
      .from("users")
      .select("id, full_name, email")
      .eq("role", "framer")
      .order("full_name", { ascending: true });
    if (workersErr) throw workersErr;

    // 3. Fetch user_sites assignments
    const { data: assignments } = await supabaseAdmin
      .from("user_sites")
      .select("user_id, site_id");

    // 4. Fetch all submissions for today
    const { data: todaySubmissions, error: subErr } = await supabaseAdmin
      .from("submissions")
      .select("id, user_id, site_id, created_at")
      .eq("submission_date", today);
    if (subErr) throw subErr;

    // Build lookup maps for fast matching
    const submissionMap = new Map();
    (todaySubmissions || []).forEach((sub) => {
      submissionMap.set(`${sub.user_id}_${sub.site_id}`, sub);
    });

    const assignmentMap = new Map();
    (assignments || []).forEach((a) => {
      if (!assignmentMap.has(a.site_id)) {
        assignmentMap.set(a.site_id, new Set());
      }
      assignmentMap.get(a.site_id).add(a.user_id);
    });

    // Construct response grouped by site
    const resultSites = (activeSites || []).map((site) => {
      const assignedUserIds = assignmentMap.get(site.id);

      // If explicit assignments exist, check assigned workers; otherwise, include all active workers
      const relevantWorkers =
        assignedUserIds && assignedUserIds.size > 0
          ? (workers || []).filter((w) => assignedUserIds.has(w.id))
          : workers || [];

      const workerStatuses = relevantWorkers.map((w) => {
        const sub = submissionMap.get(`${w.id}_${site.id}`);
        return {
          id: w.id,
          full_name: w.full_name,
          email: w.email,
          submitted: Boolean(sub),
          submission_id: sub ? sub.id : null,
          submission_time: sub ? sub.created_at : null,
        };
      });

      return {
        site_id: site.id,
        site_name: site.name,
        address: site.address,
        total_workers: workerStatuses.length,
        submitted_count: workerStatuses.filter((w) => w.submitted).length,
        missing_count: workerStatuses.filter((w) => !w.submitted).length,
        workers: workerStatuses,
      };
    });

    return {
      date: today,
      sites: resultSites,
    };
  }
}

module.exports = new AdminService();
