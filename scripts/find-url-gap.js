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
  if (url === undefined || url === null) return null;
  var idx = url.indexOf(MARKER);
  if (idx >= 0) return decodeURIComponent(url.slice(idx + MARKER.length));
  if (url.includes(".r2.dev/")) {
    try { return decodeURIComponent(new URL(url).pathname.replace(/^\//, "")); } catch(e) {}
  }
  return null;
}

async function main() {
  var res = await supabase
    .from("palettes")
    .select("id, image_url, name, user_id");

  var data = res.data;
  if (res.error) { console.error(res.error); return; }

  // 1. Check for duplicate image_urls
  var urlMap = {};
  for (var i = 0; i < data.length; i++) {
    var url = data[i].image_url || "(null)";
    if (urlMap[url] === undefined) urlMap[url] = [];
    urlMap[url].push(data[i]);
  }

  var dupeCount = 0;
  var keys = Object.keys(urlMap);
  for (var j = 0; j < keys.length; j++) {
    if (urlMap[keys[j]].length > 1) {
      dupeCount++;
      console.log("DUPLICATE image_url found (" + urlMap[keys[j]].length + " rows):");
      console.log("  URL: " + keys[j].slice(0, 100) + (keys[j].length > 100 ? "..." : ""));
      for (var k = 0; k < urlMap[keys[j]].length; k++) {
        var r = urlMap[keys[j]][k];
        console.log("    palette=" + r.id.slice(0,8) + "  name=" + JSON.stringify(r.name) + "  user=" + r.user_id.slice(0,8));
      }
    }
  }
  if (dupeCount === 0) console.log("No duplicate image_urls found.");

  // 2. Count unique keys and break down by storage backend
  var uniqueKeys = new Set();
  var r2Count = 0;
  var supaCount = 0;
  for (var m = 0; m < data.length; m++) {
    var key = extractKey(data[m].image_url);
    if (key) uniqueKeys.add(key);
    if (data[m].image_url && data[m].image_url.includes(".r2.dev/")) {
      r2Count++;
    } else if (data[m].image_url) {
      supaCount++;
    }
  }

  console.log("\n--- Reconciliation ---");
  console.log("Total palette rows:          " + data.length);
  console.log("  With Supabase Storage URL: " + supaCount);
  console.log("  With R2 URL:               " + r2Count);
  console.log("Unique storage keys:         " + uniqueKeys.size);
  console.log("Duplicates:                  " + (data.length - uniqueKeys.size));
  console.log("");
  console.log("R2 URLs point to R2 only (no file in Supabase Storage): " + r2Count);
  console.log("Expected Supabase Storage matches: " + uniqueKeys.size + " - " + r2Count + " = " + (uniqueKeys.size - r2Count));
  console.log("Cleanup script found:              61 referenced files");
  var expected = uniqueKeys.size - r2Count;
  if (expected === 61) {
    console.log("MATCH! The math checks out.");
  } else {
    console.log("MISMATCH — need deeper investigation.");
  }
}

main().catch(function(e) { console.error(e); process.exit(1); });
