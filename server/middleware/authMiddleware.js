const { supabaseAdmin } = require("../db/supabaseClient");

/**
 * Authentication Middleware
 * Validates the JWT Bearer token from the Authorization header.
 * Resolves the user identity from Supabase Auth and fetches profile role from public.users.
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication token missing or invalid",
        status: 401,
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token with Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !authData.user) {
      return res.status(401).json({
        error: "Invalid or expired session token",
        status: 401,
      });
    }

    const authUser = authData.user;

    // Fetch user profile & role from public.users
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role")
      .eq("id", authUser.id)
      .single();

    if (profileError || !profile) {
      // Fallback: If trigger hasn't fired yet, create or extract from user_metadata
      const role = "framer"; // SECURITY: Never trust user_metadata for role
      const fullName = authUser.user_metadata?.full_name || "Worker";

      const { data: newProfile } = await supabaseAdmin
        .from("users")
        .upsert({
          id: authUser.id,
          email: authUser.email,
          full_name: fullName,
          role: role,
        })
        .select()
        .single();

      req.user = newProfile || {
        id: authUser.id,
        email: authUser.email,
        full_name: fullName,
        role: role,
      };
    } else {
      req.user = profile;
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      error: "Internal authentication error",
      status: 500,
    });
  }
}

/**
 * Admin Middleware
 * Restricts access to users with the 'admin' role.
 */
function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      error: "Forbidden: Administrator privileges required",
      status: 403,
    });
  }
  next();
}

module.exports = {
  authMiddleware,
  adminMiddleware,
};
