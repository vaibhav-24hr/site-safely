import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import WebSocket from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: { fetch: fetch },
  realtime: { transport: WebSocket }
});


async function createDemoUsers() {
  const users = [
    { email: 'admin@sitesafety.com', password: 'password123', role: 'admin', name: 'Admin User' },
    { email: 'worker@sitesafety.com', password: 'password123', role: 'framer', name: 'Demo Worker' }
  ];

  for (const u of users) {
    console.log(`Creating ${u.email}...`);
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.name }
    });

    if (error && !error.message.includes('already exists')) {
      console.error('Error:', error.message);
    } else {
      console.log('User created. Updating role...');
      await new Promise(r => setTimeout(r, 1000));
      const { data: user } = await supabaseAdmin.from('users').select('id').eq('email', u.email).single();
      if (user) {
        await supabaseAdmin.from('users').update({ role: u.role }).eq('id', user.id);
        console.log(`Role updated for ${u.email}`);
      }
    }
  }
}
createDemoUsers();
