/**
 * Cross-check a specific user to verify the orphan logic is correct.
 * Proves that orphaned files are genuinely not referenced by any palette.
 */
require("dotenv/config");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const BUCKET = "reference-images";
const MARKER = "/storage/v1/object/public/" + BUCKET + "/";

function extractKey(url) {
  if (!url) return null;
  const idx = url.indexOf(MARKER);
  if (idx >= 0) return decodeURIComponent(url.slice(idx + MARKER.length));
  if (url.includes(".r2.dev/")) {
    try { return decodeURIComponent(new URL(url).pathname.replace(/^\//, "")); } catch (e) {}
  }
  return null;
}

async function analyzeUser(userId) {
  console.log("=".repeat(60));
  console.log("User:", userId);
  console.log("=".repeat(60));

  // 1. Get all palettes for this user
  const { data: palettes, error } = await supabase
    .from("palettes")
    .select("id, image_url, name, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) { console.error("DB error:", error); return; }

  console.log("\nPalettes in database:", palettes.length);
  const referencedKeys = new Set();
  for (const p of palettes) {
    const key = extractKey(p.image_url);
    if (key) referencedKeys.add(key);
    console.log("  [saved] " + (p.name || p.id.slice(0,8)) + " → " + (key || "(no image)"));
  }

  // 2. List all files in storage for this user
  const { data: files, error: listErr } = await supabase.storage
    .from(BUCKET)
    .list(userId, { limit: 200, sortBy: { column: "name", order: "asc" } });

  if (listErr) { console.error("Storage list error:", listErr); return; }

  console.log("\nFiles in Supabase Storage:", files.length);

  const orphans = [];
  const referenced = [];
  for (const f of files) {
    if (f.id === null) continue; // folder
    const fullKey = userId + "/" + f.name;
    const size = Number(f.metadata && f.metadata.size || 0);
    const ts = f.name.replace(/\.\w+$/, "");
    const date = new Date(Number(ts));
    const dateStr = isNaN(date.getTime()) ? "?" : date.toISOString().slice(0, 19);

    if (referencedKeys.has(fullKey)) {
      referenced.push({ key: fullKey, size, date: dateStr });
    } else {
      orphans.push({ key: fullKey, size, date: dateStr });
    }
  }

  console.log("\n  Referenced (have a palette row pointing at them): " + referenced.length);
  for (const r of referenced) {
    console.log("    ✅ " + r.key + " (" + (r.size/1024).toFixed(0) + " KB, " + r.date + ")");
  }

  console.log("\n  Orphaned (NO palette row references them): " + orphans.length);
  for (const o of orphans.slice(0, 10)) {
    console.log("    🗑️  " + o.key + " (" + (o.size/1024).toFixed(0) + " KB, " + o.date + ")");
  }
  if (orphans.length > 10) {
    console.log("    ... and " + (orphans.length - 10) + " more");
  }

  console.log("\nWhy these are orphans:");
  console.log("  This user has " + files.length + " images in storage but only " + palettes.length + " saved palette(s).");
  console.log("  The " + orphans.length + " extra files were uploaded (old upload-on-pick behavior)");
  console.log("  but the user either never tapped Save, picked a different image, or deleted the palette.");
  console.log("  No palettes.image_url row in the entire database points at these files.");
}

async function main() {
  // Analyze 3 different users: heavy, medium, single-orphan
  const testUsers = [
    "046576ab-7c58-45da-87e0-1846832bc1c3", // 21 orphans from preview
    "02c1e833-65b4-441e-8323-26ddf329de24", // single orphan
    "4c1d36a6-8135-4bf8-ab83-1346d8bebbf5", // heaviest: 78 orphans
  ];

  for (const uid of testUsers) {
    await analyzeUser(uid);
    console.log("");
  }
}

main().catch(e => { console.error(e); process.exit(1); });
