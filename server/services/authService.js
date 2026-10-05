const { supabase, supabaseAdmin } = require("../db/supabaseClient");

/**
 * Authentication Service
 * Handles user login and profile resolution.
 */
class AuthService {
  /**
   * Log in user with email & password via Supabase Auth
   */
  async login(email, password) {
    if (!email || !password) {
      const error = new Error("Email and password are required");
      error.status = 400;
      throw error;
    }

    // Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error || !data.session) {
      const authErr = new Error(error?.message || "Invalid email or password");
      authErr.status = 401;
      throw authErr;
    }

    const { user: authUser, session } = data;

    // Fetch user role & profile from public.users
    let { data: profile } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role")
      .eq("id", authUser.id)
      .single();

    if (!profile) {
      // Create user profile if missing
      const role = "framer"; // SECURITY: Never trust user_metadata for role
      const fullName = authUser.user_metadata?.full_name || "Worker";

      const { data: createdProfile } = await supabaseAdmin
        .from("users")
        .upsert({
          id: authUser.id,
          email: authUser.email,
          full_name: fullName,
          role: role,
        })
        .select()
        .single();

      profile = createdProfile || {
        id: authUser.id,
        email: authUser.email,
        full_name: fullName,
        role: role,
      };
    }

    return {
      token: session.access_token,
      user: profile,
    };
  }

  /**
   * Fetch current user profile
   */
  async getCurrentUser(userId) {
    const { data: profile, error } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role, created_at")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      const notFound = new Error("User profile not found");
      notFound.status = 404;
      throw notFound;
    }

    return profile;
  }
}

module.exports = new AuthService();
