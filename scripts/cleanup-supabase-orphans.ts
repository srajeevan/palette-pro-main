/**
 * Cleanup orphaned files in Supabase Storage (reference-images bucket).
 *
 * An "orphan" is a file in the bucket that is NOT referenced by any
 * `palettes.image_url` row. These accumulate when:
 *   - A user uploaded an image but never saved the palette
 *   - A palette was deleted but old code didn't clean up storage
 *   - A user deleted their account before storage cleanup was added
 *
 * IMPORTANT — R2 is intentionally left alone. R2 has plenty of storage
 * and serves as a backup. Only Supabase Storage orphans are cleaned.
 *
 * Safety:
 *   - Reads the palettes table to build a set of referenced keys
 *   - Lists every file in Supabase Storage
 *   - Compares: any storage file NOT in the referenced set is an orphan
 *   - Dry-run by default (--dry or no flag) — just prints what would be deleted
 *   - Pass --delete to actually remove orphans
 *   - Writes a manifest (cleanup-manifest-{timestamp}.json) with every action taken
 *
 * Usage:
 *   npx tsx scripts/cleanup-supabase-orphans.ts          # dry run (default)
 *   npx tsx scripts/cleanup-supabase-orphans.ts --dry    # explicit dry run
 *   npx tsx scripts/cleanup-supabase-orphans.ts --delete # actually delete orphans
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// ---------- Config ----------

const SUPABASE_URL = requireEnv('EXPO_PUBLIC_SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const SUPABASE_BUCKET = 'reference-images';

const LIVE_DELETE = process.argv.includes('--delete');
const LIST_PAGE_SIZE = 1000;
const DELETE_BATCH_SIZE = 100; // Supabase storage.remove() batch limit

// ---------- Client ----------

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ---------- Types ----------

type OrphanEntry = {
  key: string;
  size: number;
  action: 'deleted' | 'would_delete' | 'error';
  error?: string;
};

// ---------- Helpers ----------

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === '') {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// ---------- Step 1: Build set of referenced storage keys ----------

/**
 * Query every palettes.image_url that points at Supabase Storage,
 * extract the storage key, and return a Set for O(1) lookups.
 */
async function getReferencedKeys(): Promise<Set<string>> {
  const keys = new Set<string>();
  const marker = `/storage/v1/object/public/${SUPABASE_BUCKET}/`;

  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('palettes')
      .select('image_url')
      .not('image_url', 'is', null)
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Failed to query palettes: ${error.message}`);
    }
    if (!data || data.length === 0) break;

    for (const row of data) {
      const url: string = row.image_url;
      // Extract key from Supabase Storage URL
      const idx = url.indexOf(marker);
      if (idx !== -1) {
        const key = decodeURIComponent(url.slice(idx + marker.length));
        keys.add(key);
      }
      // Also handle R2 URLs — extract key to cross-reference
      // (the mirror script copies with same key, so a Supabase file
      //  might be referenced via an R2 URL if the palette was updated)
      if (url.includes('.r2.dev/')) {
        try {
          const u = new URL(url);
          const key = decodeURIComponent(u.pathname.replace(/^\//, ''));
          keys.add(key);
        } catch { /* ignore malformed */ }
      }
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return keys;
}

// ---------- Step 2: List all files in Supabase Storage ----------

type StorageFile = {
  key: string;
  size: number;
};

async function listFolder(folderPath: string): Promise<any[]> {
  const all: any[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .list(folderPath, {
        limit: LIST_PAGE_SIZE,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      throw new Error(`Failed to list "${folderPath}": ${error.message}`);
    }
    if (!data || data.length === 0) break;

    all.push(...data);
    if (data.length < LIST_PAGE_SIZE) break;
    offset += LIST_PAGE_SIZE;
  }

  return all;
}

async function listAllStorageFiles(): Promise<StorageFile[]> {
  console.log(`Listing files in Supabase bucket "${SUPABASE_BUCKET}"…`);
  const files: StorageFile[] = [];

  // Root → user folders
  const topLevel = await listFolder('');
  console.log(`  Found ${topLevel.length} top-level entries`);

  for (const entry of topLevel) {
    if (entry.id === null) {
      // Folder (userId)
      const inner = await listFolder(entry.name);
      for (const f of inner) {
        if (f.id !== null) {
          files.push({
            key: `${entry.name}/${f.name}`,
            size: Number(f.metadata?.size ?? 0),
          });
        }
      }
    } else {
      // File at root (rare)
      files.push({
        key: entry.name,
        size: Number(entry.metadata?.size ?? 0),
      });
    }
  }

  return files;
}

// ---------- Step 3: Find and delete orphans ----------

async function deleteOrphans(orphanKeys: string[]): Promise<OrphanEntry[]> {
  const results: OrphanEntry[] = [];

  for (let i = 0; i < orphanKeys.length; i += DELETE_BATCH_SIZE) {
    const batch = orphanKeys.slice(i, i + DELETE_BATCH_SIZE);
    console.log(
      `  Deleting batch ${Math.floor(i / DELETE_BATCH_SIZE) + 1}/${Math.ceil(orphanKeys.length / DELETE_BATCH_SIZE)} (${batch.length} files)…`,
    );

    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .remove(batch);

    if (error) {
      console.error(`  Batch delete error: ${error.message}`);
      for (const key of batch) {
        results.push({ key, size: 0, action: 'error', error: error.message });
      }
    } else {
      for (const key of batch) {
        results.push({ key, size: 0, action: 'deleted' });
      }
    }
  }

  return results;
}

// ---------- Main ----------

async function main() {
  console.log('='.repeat(60));
  console.log('Cleanup orphaned files in Supabase Storage');
  console.log('='.repeat(60));
  console.log(`Supabase bucket: ${SUPABASE_BUCKET}`);
  console.log(`Mode:            ${LIVE_DELETE ? '🔴 LIVE DELETE' : '🟢 DRY RUN (pass --delete to remove)'}`);
  console.log('');

  const started = Date.now();

  // 1. Get all referenced keys from the database
  console.log('Step 1: Querying palettes table for referenced image URLs…');
  const referencedKeys = await getReferencedKeys();
  console.log(`  Found ${referencedKeys.size} referenced storage keys\n`);

  // 2. List all files in Supabase Storage
  console.log('Step 2: Listing all files in Supabase Storage…');
  const allFiles = await listAllStorageFiles();
  const totalBytes = allFiles.reduce((acc, f) => acc + f.size, 0);
  console.log(`  Found ${allFiles.length} files totaling ${formatBytes(totalBytes)}\n`);

  // 3. Find orphans
  console.log('Step 3: Identifying orphans…');
  const orphans = allFiles.filter((f) => !referencedKeys.has(f.key));
  const orphanBytes = orphans.reduce((acc, f) => acc + f.size, 0);
  const referenced = allFiles.length - orphans.length;

  console.log(`  Referenced: ${referenced} files`);
  console.log(`  Orphaned:   ${orphans.length} files (${formatBytes(orphanBytes)})`);
  console.log('');

  if (orphans.length === 0) {
    console.log('No orphans found. Bucket is clean! 🎉');
    return;
  }

  // Print first 20 orphans as preview
  console.log(`Preview (first ${Math.min(20, orphans.length)} orphans):`);
  for (const o of orphans.slice(0, 20)) {
    console.log(`  🗑️  ${o.key}  (${formatBytes(o.size)})`);
  }
  if (orphans.length > 20) {
    console.log(`  … and ${orphans.length - 20} more`);
  }
  console.log('');

  // 4. Delete or report
  let manifest: OrphanEntry[];

  if (LIVE_DELETE) {
    console.log(`Step 4: Deleting ${orphans.length} orphaned files…`);
    manifest = await deleteOrphans(orphans.map((o) => o.key));
    // Patch sizes into manifest
    const sizeMap = new Map(orphans.map((o) => [o.key, o.size]));
    for (const entry of manifest) {
      entry.size = sizeMap.get(entry.key) ?? 0;
    }
  } else {
    console.log('Step 4: DRY RUN — no files deleted.');
    console.log('  Run with --delete to actually remove these files.');
    manifest = orphans.map((o) => ({
      key: o.key,
      size: o.size,
      action: 'would_delete' as const,
    }));
  }

  // 5. Write manifest
  const manifestDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(manifestDir)) {
    fs.mkdirSync(manifestDir, { recursive: true });
  }
  const manifestPath = path.join(
    manifestDir,
    `cleanup-manifest-${Date.now()}.json`,
  );
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        mode: LIVE_DELETE ? 'LIVE' : 'DRY_RUN',
        bucket: SUPABASE_BUCKET,
        totalFiles: allFiles.length,
        totalBytes,
        referencedCount: referenced,
        orphanCount: orphans.length,
        orphanBytes,
        entries: manifest,
      },
      null,
      2,
    ),
  );
  console.log(`\nManifest written to: ${manifestPath}`);

  // Summary
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  const deleted = manifest.filter((e) => e.action === 'deleted').length;
  const errors = manifest.filter((e) => e.action === 'error').length;

  console.log('');
  console.log('='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Mode:             ${LIVE_DELETE ? 'LIVE DELETE' : 'DRY RUN'}`);
  console.log(`Total in bucket:  ${allFiles.length} files (${formatBytes(totalBytes)})`);
  console.log(`Referenced:       ${referenced}`);
  console.log(`Orphaned:         ${orphans.length} (${formatBytes(orphanBytes)})`);
  if (LIVE_DELETE) {
    console.log(`Deleted:          ${deleted}`);
    console.log(`Errors:           ${errors}`);
    console.log(`Space freed:      ~${formatBytes(orphanBytes)}`);
  }
  console.log(`Elapsed:          ${elapsed}s`);

  if (errors > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
