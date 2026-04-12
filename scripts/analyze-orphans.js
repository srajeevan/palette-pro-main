const data = JSON.parse(require("fs").readFileSync(process.argv[2], "utf8"));

// Group orphans by userId
const byUser = {};
for (const e of data.entries) {
  const userId = e.key.split("/")[0];
  if (byUser[userId] === undefined) byUser[userId] = { count: 0, bytes: 0 };
  byUser[userId].count++;
  byUser[userId].bytes += e.size;
}

const sorted = Object.entries(byUser).sort((a, b) => b[1].count - a[1].count);

console.log("Orphans by user (top 15):");
console.log("Count  | Size       | User ID");
console.log("-------|------------|--------------------------------------");
for (const [uid, v] of sorted.slice(0, 15)) {
  const mb = (v.bytes / 1024 / 1024).toFixed(1);
  console.log(String(v.count).padStart(5) + "  | " + (mb + " MB").padStart(10) + " | " + uid);
}
if (sorted.length > 15) console.log("... and " + (sorted.length - 15) + " more users");
console.log("\nTotal users with orphans:", sorted.length);

// Check: how many orphan userIds have ZERO palettes in the DB?
// (we can check by seeing if ANY file from that user is in the referenced set)
const referencedUsers = new Set();
// We don't have referenced keys easily, but we can check the total stats
console.log("\n--- Example orphan patterns ---\n");

// Show a user with MANY orphans (likely heavy tester or old uploads)
if (sorted.length > 0) {
  const [topUid, topStats] = sorted[0];
  const topFiles = data.entries.filter(e => e.key.startsWith(topUid + "/"));
  console.log("Heaviest orphan user: " + topUid);
  console.log("  " + topStats.count + " orphaned files, " + (topStats.bytes / 1024 / 1024).toFixed(1) + " MB");
  console.log("  Sample files:");
  for (const f of topFiles.slice(0, 5)) {
    const ts = f.key.split("/")[1].replace(/\.\w+$/, "");
    const date = new Date(Number(ts));
    const dateStr = isNaN(date.getTime()) ? "unknown date" : date.toISOString().slice(0, 19);
    console.log("    " + f.key + " (" + (f.size / 1024).toFixed(0) + " KB, uploaded ~" + dateStr + ")");
  }
}

// Show single-orphan users (likely one-time users who never saved)
const singleOrphan = sorted.filter(([, v]) => v.count === 1);
console.log("\nUsers with exactly 1 orphan: " + singleOrphan.length);
console.log("  (Likely users who uploaded once but never saved a palette)");

// Show multi-orphan users (likely users who uploaded many times, replaced images)
const multiOrphan = sorted.filter(([, v]) => v.count > 5);
console.log("\nUsers with >5 orphans: " + multiOrphan.length);
console.log("  (Likely heavy users or testers with lots of upload-without-save cycles)");
