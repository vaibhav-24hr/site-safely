const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.warn('⚠️ Warning: SUPABASE_URL is not set in environment variables.');
}

// Client for standard public operations
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

// Admin client with service role key (bypasses RLS for server-side operations)
const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceRoleKey || supabaseAnonKey || 'placeholder-service-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Health check helper to verify Supabase connectivity
 */
async function checkDbConnection() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { connected: false, message: 'Missing Supabase credentials in .env' };
  }
  try {
    const { data, error } = await supabaseAdmin.from('sites').select('count', { count: 'exact', head: true });
    if (error) throw error;
    return { connected: true, message: 'Connected to Supabase PostgreSQL database' };
  } catch (err) {
    return { connected: false, message: err.message };
  }
}

module.exports = {
  supabase,
  supabaseAdmin,
  checkDbConnection
};
