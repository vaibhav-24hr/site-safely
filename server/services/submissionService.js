const { supabaseAdmin } = require("../db/supabaseClient");

/**
 * Submission Service
 * Handles safety form submissions, querying, and authorization boundaries.
 */
class SubmissionService {
  /**
   * Create a new daily safety form submission
   */
  async createSubmission(userId, submissionData, files = []) {
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
      notes,
    } = submissionData;

    // Verify site exists and is active
    const { data: site, error: siteError } = await supabaseAdmin
      .from("sites")
      .select("id, name")
      .eq("id", site_id)
      .eq("active", true)
      .single();

    if (siteError || !site) {
      const err = new Error("Selected job site does not exist or is inactive");
      err.status = 400;
      throw err;
    }

    const today = new Date().toISOString().split("T")[0];

    // Check for duplicate submission today
    const { data: existingSub } = await supabaseAdmin
      .from("submissions")
      .select("id")
      .eq("user_id", userId)
      .eq("site_id", site_id)
      .eq("submission_date", today)
      .single();

    if (existingSub) {
      const err = new Error("You have already submitted a safety form for this site today.");
      err.status = 409;
      throw err;
    }

    // Insert safety submission (booleans already parsed by validationMiddleware)
    const { data: submission, error: subError } = await supabaseAdmin
      .from("submissions")
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
        notes: notes ? notes.trim() : null,
      })
      .select(
        `
        *,
        site:sites(id, name, address)
      `,
      )
      .single();

    if (subError) {
      console.error("Submission creation error:", subError);
      const err = new Error(
        subError.message || "Failed to record safety submission",
      );
      err.status = 500;
      throw err;
    }

    try {
      // Ensure worker is registered in user_sites for this site
      const { error: userSiteError } = await supabaseAdmin
        .from("user_sites")
        .upsert({ user_id: userId, site_id: site_id });

      if (userSiteError) {
        throw new Error(`Failed to assign worker to site: ${userSiteError.message}`);
      }

      // Handle photo uploads to Supabase Storage
      if (files && files.length > 0) {
        const photoRecords = [];
        for (const file of files) {
          // Generate unique filename
          const ext = file.originalname.split(".").pop() || "jpg";
          const fileName = `${submission.id}/${Date.now()}-${Math.round(Math.random() * 1000)}.${ext}`;

          // Upload to Supabase Storage
          const { data, error: uploadError } = await supabaseAdmin.storage
            .from("safety-photos")
            .upload(fileName, file.buffer, {
              contentType: file.mimetype,
            });

          if (uploadError) {
            throw new Error(`Failed to upload photo: ${uploadError.message}`);
          }

          // Get public URL
          const { data: publicUrlData } = supabaseAdmin.storage
            .from("safety-photos")
            .getPublicUrl(fileName);

          photoRecords.push({
            submission_id: submission.id,
            url: publicUrlData.publicUrl,
            file_name: file.originalname,
            file_type: file.mimetype,
            file_size: file.size,
          });
        }

        // Insert records into photos table
        if (photoRecords.length > 0) {
          const { error: dbError } = await supabaseAdmin
            .from("photos")
            .insert(photoRecords);

          if (dbError) {
            throw new Error(`Failed to save photo records: ${dbError.message}`);
          }
        }
      }
    } catch (err) {
      // Rollback: delete submission (cascade handles photos in DB)
      await supabaseAdmin.from("submissions").delete().eq("id", submission.id);
      
      // Rollback: delete photos in storage
      const { data: filesList } = await supabaseAdmin.storage
        .from("safety-photos")
        .list(submission.id);
      if (filesList && filesList.length > 0) {
        const pathsToDelete = filesList.map(file => `${submission.id}/${file.name}`);
        await supabaseAdmin.storage.from("safety-photos").remove(pathsToDelete);
      }
      
      err.status = 500;
      throw err;
    }

    return submission;
  }

  /**
   * Get past submissions for the logged-in worker
   */
  async getWorkerSubmissions(userId) {
    const { data: submissions, error } = await supabaseAdmin
      .from("submissions")
      .select(
        `
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
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching worker submissions:", error);
      const err = new Error("Failed to retrieve your submissions");
      err.status = 500;
      throw err;
    }

    // Format output with photo count
    return (submissions || []).map((sub) => ({
      ...sub,
      site_name: sub.site?.name || "Unknown Site",
      photo_count: sub.photos ? sub.photos.length : 0,
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
    }));
  }

  /**
   * Get submission details by ID with authorization check
   */
  async getSubmissionById(submissionId, requestingUserId, userRole) {
    const { data: submission, error } = await supabaseAdmin
      .from("submissions")
      .select(
        `
        *,
        worker:users(id, full_name, email, role),
        site:sites(id, name, address)
      `,
      )
      .eq("id", submissionId)
      .single();

    if (error || !submission) {
      const notFound = new Error("Submission not found");
      notFound.status = 404;
      throw notFound;
    }

    // Enforce data isolation: Framers can ONLY view their own submission
    if (userRole !== "admin" && submission.user_id !== requestingUserId) {
      const forbidden = new Error(
        "Forbidden: You can only access your own safety submissions",
      );
      forbidden.status = 403;
      throw forbidden;
    }

    // Retrieve attached photos
    const { data: photos } = await supabaseAdmin
      .from("photos")
      .select("id, url, file_name, file_type, file_size, created_at")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: true });

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
      photos: photos || [],
    };
  }

  /**
   * Delete a submission
   */
  async deleteSubmission(submissionId, requestingUserId, userRole) {
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from("submissions")
      .select("user_id")
      .eq("id", submissionId)
      .single();

    if (fetchError || !submission) {
      const notFound = new Error("Submission not found");
      notFound.status = 404;
      throw notFound;
    }

    // Admins can delete anything. Workers only their own.
    const isAdmin = userRole === "admin";
    if (!isAdmin && submission.user_id !== requestingUserId) {
      const forbidden = new Error(
        "Forbidden: You can only delete your own submissions",
      );
      forbidden.status = 403;
      throw forbidden;
    }

    const { error: deleteError } = await supabaseAdmin
      .from("submissions")
      .delete()
      .eq("id", submissionId);

    if (deleteError) {
      throw new Error("Failed to delete submission");
    }

    // Cleanup: Remove all photos in this submission's storage folder
    const { data: filesList } = await supabaseAdmin.storage
      .from("safety-photos")
      .list(submissionId);
    
    if (filesList && filesList.length > 0) {
      const pathsToDelete = filesList.map(file => `${submissionId}/${file.name}`);
      await supabaseAdmin.storage.from("safety-photos").remove(pathsToDelete);
    }

    return { success: true };
  }

  /**
   * Update a submission
   */
  async updateSubmission(submissionId, requestingUserId, userRole, updateData) {
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from("submissions")
      .select("user_id")
      .eq("id", submissionId)
      .single();

    if (fetchError || !submission) {
      const notFound = new Error("Submission not found");
      notFound.status = 404;
      throw notFound;
    }

    const isAdmin = userRole === "admin";
    if (!isAdmin && submission.user_id !== requestingUserId) {
      const forbidden = new Error(
        "Forbidden: You can only update your own submissions",
      );
      forbidden.status = 403;
      throw forbidden;
    }

    const updates = {};
    const checklistFields = [
      "ppe_hard_hat",
      "ppe_vest",
      "ppe_boots",
      "ppe_eye_protection",
      "fall_protection",
      "ladders_scaffolding",
      "tools_cords",
      "hazards_identified",
    ];

    for (const field of checklistFields) {
      if (updateData[field] !== undefined) {
        let val = updateData[field];
        if (val === "true") val = true;
        if (val === "false") val = false;
        updates[field] = Boolean(val);
      }
    }
    if (updateData.notes !== undefined) {
      updates.notes = typeof updateData.notes === "string" ? updateData.notes.trim() : updateData.notes;
    }

    const { data: updatedSub, error: updateError } = await supabaseAdmin
      .from("submissions")
      .update(updates)
      .eq("id", submissionId)
      .select(
        `
        *,
        worker:users(id, full_name, email, role),
        site:sites(id, name, address)
      `,
      )
      .single();

    if (updateError) {
      throw new Error("Failed to update submission");
    }

    return updatedSub;
  }
}

module.exports = new SubmissionService();
