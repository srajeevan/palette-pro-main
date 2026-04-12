/**
 * Validate that every palette's image_url is still accessible in storage.
 *
 * For each palette row with an image_url, sends a HEAD request to the URL.
 * Reports which ones return 200 (alive) vs non-200 (broken).
 *
 * Run BEFORE and AFTER cleanup to confirm no referenced images were deleted.
 *
 * Usage:
 *   node scripts/validate-palette-images.js
 */

require("dotenv/config");
var { createClient } = require("@supabase/supabase-js");

var supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function checkUrl(url) {
  try {
    var resp = await fetch(url, { method: "HEAD" });
    return { status: resp.status, ok: resp.ok };
  } catch (err) {
    return { status: 0, ok: false, error: err.message };
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("Validating all palette image URLs are accessible");
  console.log("=".repeat(60));
  console.log("");

  // Fetch all palettes with image_url
  var res = await supabase
    .from("palettes")
    .select("id, name, user_id, image_url")
    .not("image_url", "is", null)
    .order("created_at", { ascending: true });

  if (res.error) {
    console.error("Failed to query palettes:", res.error);
    process.exit(1);
  }

  var palettes = res.data;
  console.log("Palettes with image_url: " + palettes.length);
  console.log("");

  var alive = [];
  var broken = [];

  for (var i = 0; i < palettes.length; i++) {
    var p = palettes[i];
    var result = await checkUrl(p.image_url);
    var prefix = "[" + (i + 1) + "/" + palettes.length + "]";

    var backend = "unknown";
    if (p.image_url.includes("supabase.co/storage")) backend = "supabase";
    else if (p.image_url.includes(".r2.dev/")) backend = "r2";

    if (result.ok) {
      alive.push(p);
      console.log(prefix + " OK   " + backend.padEnd(9) + " " + p.name + " (user:" + p.user_id.slice(0, 8) + ")");
    } else {
      broken.push({ palette: p, status: result.status, error: result.error });
      console.log(prefix + " FAIL " + backend.padEnd(9) + " " + p.name + " (user:" + p.user_id.slice(0, 8) + ") HTTP " + result.status + (result.error ? " " + result.error : ""));
    }
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("Results");
  console.log("=".repeat(60));
  console.log("Total checked:  " + palettes.length);
  console.log("Alive (200):    " + alive.length);
  console.log("Broken:         " + broken.length);

  if (broken.length > 0) {
    console.log("");
    console.log("BROKEN IMAGES:");
    for (var b = 0; b < broken.length; b++) {
      var entry = broken[b];
      console.log("  palette=" + entry.palette.id.slice(0, 8) + "  name=" + JSON.stringify(entry.palette.name) + "  user=" + entry.palette.user_id.slice(0, 8) + "  status=" + entry.status);
      console.log("    url=" + entry.palette.image_url);
    }
  } else {
    console.log("\nAll palette images are accessible! Safe to proceed.");
  }
}

main().catch(function (e) {
  console.error(e);
  process.exit(1);
});
