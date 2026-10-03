const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.warn('⚠️ Warning: SUPABASE_URL is not set in environment variables.');
}

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  realtime: {
    transport: WebSocket
  }
};

// Client for standard public operations
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  clientOptions
);

// Admin client with service role key (bypasses RLS for server-side operations)
const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceRoleKey || supabaseAnonKey || 'placeholder-service-key',
  clientOptions
);

/**
 * Health check helper to verify Supabase connectivity
 */
async function checkDbConnection() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { connected: false, message: 'Missing Supabase credentials in .env' };
  }
  try {
    const { data, error } = await supabaseAdmin.from('sites').select('*').limit(5);
    if (error) throw error;
    return { connected: true, sitesCount: data ? data.length : 0, message: 'Connected to Supabase PostgreSQL database' };
  } catch (err) {
    return { connected: false, message: err.message };
  }
}

module.exports = {
  supabase,
  supabaseAdmin,
  checkDbConnection
};
