import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import WebSocket from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: { fetch: fetch },
  realtime: { transport: WebSocket },
});

const DEMO_PASSWORD = "demo1234";

const demoUsers = [
  { email: "admin@sitesafety.com", name: "Demo Admin", role: "admin" },
  { email: "john@sitesafety.com", name: "John Doe", role: "framer" },
  { email: "mike@sitesafety.com", name: "Mike Smith", role: "framer" },
  { email: "sarah@sitesafety.com", name: "Sarah Connor", role: "framer" },
  { email: "david@sitesafety.com", name: "David Miller", role: "framer" },
  { email: "alex@sitesafety.com", name: "Alex Johnson", role: "framer" },
];

async function seedData() {
  console.log("--- Starting Database Seed ---");

  // 0. Delete Old Data
  console.log("Truncating old data...");
  await supabaseAdmin
    .from("photos")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  await supabaseAdmin
    .from("submissions")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  await supabaseAdmin
    .from("user_sites")
    .delete()
    .neq("user_id", "00000000-0000-0000-0000-000000000000");
  console.log("Old data cleared.");

  // 1. Create or Update Users
  const userMap = {};
  for (const u of demoUsers) {
    console.log(`Processing user: ${u.email}`);

    // Check if user exists
    let userId;
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", u.email)
      .single();

    if (!existingUser) {
      const { data: authUser, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: u.name },
        });
      if (authError) {
        console.error(
          `Error creating auth user ${u.email}:`,
          authError.message,
        );
        continue;
      }
      userId = authUser.user.id;
      // Wait a moment for trigger
      await new Promise((r) => setTimeout(r, 1000));
      await supabaseAdmin
        .from("users")
        .update({ role: u.role })
        .eq("id", userId);
    } else {
      userId = existingUser.id;
      // Update password just in case
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: DEMO_PASSWORD,
      });
      await supabaseAdmin
        .from("users")
        .update({ role: u.role })
        .eq("id", userId);
    }
    userMap[u.email] = userId;
  }

  // 2. Fetch Job Sites
  const { data: sites } = await supabaseAdmin
    .from("sites")
    .select("id, name")
    .limit(4);
  if (!sites || sites.length === 0) {
    console.error("No job sites found! Run schema/seed.sql first.");
    return;
  }
  const siteIds = sites.map((s) => s.id);

  // 3. Link Workers to Sites (user_sites) to demonstrate "Missing Workers"
  console.log("Linking workers to sites...");
  const framers = demoUsers
    .filter((u) => u.role === "framer")
    .map((u) => userMap[u.email]);

  for (let i = 0; i < framers.length; i++) {
    const siteId = siteIds[i % siteIds.length];
    await supabaseAdmin
      .from("user_sites")
      .upsert({ user_id: framers[i], site_id: siteId });
  }

  // 4. Create Dummy Submissions
  console.log("Generating dummy submissions...");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const dates = [
    today.toISOString().split("T")[0],
    yesterday.toISOString().split("T")[0],
    twoDaysAgo.toISOString().split("T")[0],
  ];

  const submissions = [];

  // Create ~10 submissions
  // We intentionally leave some framers without a submission "today" so they show up as missing
  for (let i = 0; i < 10; i++) {
    const workerId = framers[i % framers.length];
    const siteId = siteIds[i % siteIds.length];

    // Only workers 0 and 1 submit for today
    let dateStr = dates[1]; // default yesterday
    if (i === 0 || i === 1) dateStr = dates[0]; // today
    if (i === 4 || i === 5) dateStr = dates[2]; // 2 days ago

    const isSafe = i % 3 !== 0; // Every 3rd submission has a hazard

    submissions.push({
      user_id: workerId,
      site_id: siteId,
      submission_date: dateStr,
      ppe_hard_hat: true,
      ppe_vest: isSafe,
      ppe_boots: true,
      ppe_eye_protection: true,
      fall_protection: true,
      ladders_scaffolding: true,
      tools_cords: isSafe,
      hazards_identified: true, // true means NO undocumented hazards
      notes: isSafe
        ? "All good today."
        : "Forgot vest, grabbed spare. Frayed extension cord removed.",
    });
  }

  const { data: insertedSubs, error: subError } = await supabaseAdmin
    .from("submissions")
    .insert(submissions)
    .select("id");

  if (subError) {
    console.error("Error inserting submissions:", subError);
  } else {
    console.log(`Inserted ${insertedSubs.length} dummy submissions.`);

    // 5. Add Dummy Photos to the first 3 submissions
    console.log("Adding dummy photos...");
    const photos = [];
    for (let i = 0; i < Math.min(3, insertedSubs.length); i++) {
      photos.push({
        submission_id: insertedSubs[i].id,
        url: "https://images.unsplash.com/photo-1541888086225-f67a710e1c61?auto=format&fit=crop&q=80&w=800",
        file_name: "dummy_site_photo.jpg",
        file_type: "image/jpeg",
        file_size: 150000,
      });
    }

    await supabaseAdmin.from("photos").insert(photos);
  }

  console.log("--- Seed Complete! ---");
  console.log("Demo Credentials:");
  console.log("Admin: admin@sitesafety.com / demo1234");
  console.log("Worker: john@sitesafety.com / demo1234");
}

seedData().catch(console.error);
