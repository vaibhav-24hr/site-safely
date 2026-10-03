const { supabaseAdmin } = require('../db/supabaseClient');

/**
 * Submission Service
 * Handles safety form submissions, querying, and authorization boundaries.
 */
class SubmissionService {
  /**
   * Create a new daily safety form submission
   */
  async createSubmission(userId, submissionData) {
    const {
      site_id,
      ppe_hard_hat,
      ppe_vest,
      ppe_boots,
      ppe_eye_protection,
      fall_protection,
      ladders_scaffolding,
      tools_cords,
      hazards_identified,
      notes
    } = submissionData;

    // Verify site exists and is active
    const { data: site, error: siteError } = await supabaseAdmin
      .from('sites')
      .select('id, name')
      .eq('id', site_id)
      .eq('active', true)
      .single();

    if (siteError || !site) {
      const err = new Error('Selected job site does not exist or is inactive');
      err.status = 400;
      throw err;
    }

    const today = new Date().toISOString().split('T')[0];

    // Insert safety submission
    const { data: submission, error: subError } = await supabaseAdmin
      .from('submissions')
      .insert({
        user_id: userId,
        site_id: site_id,
        submission_date: today,
        ppe_hard_hat: Boolean(ppe_hard_hat),
        ppe_vest: Boolean(ppe_vest),
        ppe_boots: Boolean(ppe_boots),
        ppe_eye_protection: Boolean(ppe_eye_protection),
        fall_protection: Boolean(fall_protection),
        ladders_scaffolding: Boolean(ladders_scaffolding),
        tools_cords: Boolean(tools_cords),
        hazards_identified: Boolean(hazards_identified),
        notes: notes ? notes.trim() : null
      })
      .select(`
        *,
        site:sites(id, name, address)
      `)
      .single();

    if (subError) {
      console.error('Submission creation error:', subError);
      const err = new Error(subError.message || 'Failed to record safety submission');
      err.status = 500;
      throw err;
    }

    // Ensure worker is registered in user_sites for this site
    await supabaseAdmin
      .from('user_sites')
      .upsert({ user_id: userId, site_id: site_id })
      .catch((e) => console.warn('Non-critical: user_site link skipped:', e.message));

    return submission;
  }

  /**
   * Get past submissions for the logged-in worker
   */
  async getWorkerSubmissions(userId) {
    const { data: submissions, error } = await supabaseAdmin
      .from('submissions')
      .select(`
        id,
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
        site:sites(id, name, address),
        photos(id)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching worker submissions:', error);
      const err = new Error('Failed to retrieve your submissions');
      err.status = 500;
      throw err;
    }

    // Format output with photo count
    return (submissions || []).map((sub) => ({
      ...sub,
      site_name: sub.site?.name || 'Unknown Site',
      photo_count: sub.photos ? sub.photos.length : 0
    }));
  }

  /**
   * Get submission details by ID with authorization check
   */
  async getSubmissionById(submissionId, requestingUserId, userRole) {
    const { data: submission, error } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        worker:users(id, full_name, email, role),
        site:sites(id, name, address)
      `)
      .eq('id', submissionId)
      .single();

    if (error || !submission) {
      const notFound = new Error('Submission not found');
      notFound.status = 404;
      throw notFound;
    }

    // Enforce data isolation: Framers can ONLY view their own submission
    if (userRole !== 'admin' && submission.user_id !== requestingUserId) {
      const forbidden = new Error('Forbidden: You can only access your own safety submissions');
      forbidden.status = 403;
      throw forbidden;
    }

    // Retrieve attached photos
    const { data: photos } = await supabaseAdmin
      .from('photos')
      .select('id, url, file_name, file_type, file_size, created_at')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: true });

    return {
      ...submission,
      photos: photos || []
    };
  }
}

module.exports = new SubmissionService();
