/**
 * Phase 2 — Full mirror: Supabase Storage (reference-images) → Cloudflare R2
 *
 * What this script does:
 *   1. Lists EVERY object in the Supabase `reference-images` bucket (recursive)
 *   2. For each object:
 *      a. Checks if it already exists in R2 with the same size (HeadObject)
 *      b. If not present (or size differs), downloads from Supabase and uploads to R2
 *      c. Preserves the exact key path (e.g. `userId/timestamp.jpeg`)
 *   3. Prints progress + final summary
 *
 * What this script DOES NOT do (SAFETY GUARANTEES):
 *   - Does NOT modify the Supabase database (no INSERT/UPDATE/DELETE on any table)
 *   - Does NOT delete ANYTHING from Supabase storage
 *   - Does NOT overwrite ANYTHING in Supabase storage
 *   - Does NOT delete anything from R2
 *   - Does NOT skip orphans (full mirror as requested)
 *
 * The ONLY write operations this script performs are PutObject into the R2 bucket.
 * Every Supabase operation is strictly read-only (list + download).
 *
 * Idempotent: safe to run multiple times. Already-mirrored files are skipped.
 *
 * Usage:
 *   npm run mirror:r2            # real run
 *   npm run mirror:r2 -- --dry   # dry-run, lists what would happen, no writes
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';

// ---------- Config ----------

const SUPABASE_URL = requireEnv('EXPO_PUBLIC_SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const SUPABASE_BUCKET = 'reference-images';

const R2_ACCOUNT_ID = requireEnv('R2_ACCOUNT_ID');
const R2_ACCESS_KEY_ID = requireEnv('R2_ACCESS_KEY_ID');
const R2_SECRET_ACCESS_KEY = requireEnv('R2_SECRET_ACCESS_KEY');
const R2_BUCKET = requireEnv('R2_BUCKET_NAME');
const R2_ENDPOINT = requireEnv('R2_ENDPOINT');

const DRY_RUN = process.argv.includes('--dry');
const LIST_PAGE_SIZE = 1000;
const MAX_CONCURRENT = 5; // parallel transfers

// ---------- Clients ----------

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const r2 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ---------- Types ----------

type SupabaseFile = {
  key: string; // full key e.g. "userId/1735234890.jpeg"
  size: number;
  contentType: string;
};

type Stats = {
  total: number;
  skipped: number;
  copied: number;
  failed: number;
  bytesCopied: number;
  errors: Array<{ key: string; error: string }>;
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

/**
 * Recursively list every file in the Supabase bucket.
 * The bucket layout is `{userId}/{timestamp}.{ext}`, so we list the root
 * (returns user folders), then list inside each folder.
 */
async function listAllSupabaseFiles(): Promise<SupabaseFile[]> {
  console.log(`Listing files in Supabase bucket "${SUPABASE_BUCKET}"…`);

  const files: SupabaseFile[] = [];

  // Step 1: list root to get user folders
  const userFolders = await listFolder('');
  console.log(`  Found ${userFolders.length} top-level entries`);

  // Step 2: for each folder entry, list its contents
  for (const entry of userFolders) {
    // In Supabase storage, folders have id === null, files have an id
    if (entry.id === null) {
      // It's a folder (userId)
      const inner = await listFolder(entry.name);
      for (const f of inner) {
        if (f.id !== null) {
          files.push({
            key: `${entry.name}/${f.name}`,
            size: Number(f.metadata?.size ?? 0),
            contentType: String(f.metadata?.mimetype ?? 'application/octet-stream'),
          });
        }
      }
    } else {
      // Rare: a file at the root
      files.push({
        key: entry.name,
        size: Number(entry.metadata?.size ?? 0),
        contentType: String(entry.metadata?.mimetype ?? 'application/octet-stream'),
      });
    }
  }

  return files;
}

async function listFolder(path: string): Promise<any[]> {
  const all: any[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .list(path, {
        limit: LIST_PAGE_SIZE,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      throw new Error(`Failed to list "${path}": ${error.message}`);
    }
    if (!data || data.length === 0) break;

    all.push(...data);
    if (data.length < LIST_PAGE_SIZE) break;
    offset += LIST_PAGE_SIZE;
  }

  return all;
}

/**
 * Check if an object already exists in R2 with the same size.
 * Returns true if we can skip it.
 */
async function existsInR2(key: string, expectedSize: number): Promise<boolean> {
  try {
    const head = await r2.send(
      new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    );
    const r2Size = Number(head.ContentLength ?? -1);
    // If sizes differ, re-upload. If expectedSize is 0 (unknown), trust R2 existence.
    if (expectedSize === 0) return true;
    return r2Size === expectedSize;
  } catch (err: any) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === 'NotFound') {
      return false;
    }
    // Unexpected error: rethrow so we don't silently overwrite
    throw err;
  }
}

/**
 * Download a single file from Supabase as a Buffer.
 */
async function downloadFromSupabase(key: string): Promise<Buffer> {
  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .download(key);

  if (error) {
    throw new Error(`Download failed for ${key}: ${error.message}`);
  }
  if (!data) {
    throw new Error(`Download returned no data for ${key}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Upload a buffer to R2 at the given key.
 */
async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

/**
 * Process a single file: check → download → upload.
 * Updates stats in place.
 */
async function mirrorFile(
  file: SupabaseFile,
  stats: Stats,
  index: number,
  total: number,
): Promise<void> {
  const prefix = `[${index + 1}/${total}]`;

  try {
    const alreadyThere = await existsInR2(file.key, file.size);
    if (alreadyThere) {
      stats.skipped++;
      console.log(`${prefix} SKIP  ${file.key} (already in R2)`);
      return;
    }

    if (DRY_RUN) {
      stats.copied++;
      stats.bytesCopied += file.size;
      console.log(
        `${prefix} DRY   ${file.key}  (${formatBytes(file.size)}, ${file.contentType})`,
      );
      return;
    }

    const buf = await downloadFromSupabase(file.key);
    await uploadToR2(file.key, buf, file.contentType);

    stats.copied++;
    stats.bytesCopied += buf.length;
    console.log(
      `${prefix} COPY  ${file.key}  (${formatBytes(buf.length)})`,
    );
  } catch (err: any) {
    stats.failed++;
    const msg = err?.message ?? String(err);
    stats.errors.push({ key: file.key, error: msg });
    console.error(`${prefix} FAIL  ${file.key}  ${msg}`);
  }
}

/**
 * Run mirrorFile over the list with bounded concurrency.
 */
async function mirrorWithConcurrency(
  files: SupabaseFile[],
  stats: Stats,
): Promise<void> {
  let cursor = 0;
  const total = files.length;

  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= total) return;
      await mirrorFile(files[i], stats, i, total);
    }
  }

  const workers = Array.from({ length: MAX_CONCURRENT }, () => worker());
  await Promise.all(workers);
}

// ---------- Main ----------

async function main() {
  console.log('='.repeat(60));
  console.log('Phase 2: Mirror Supabase Storage → Cloudflare R2');
  console.log('='.repeat(60));
  console.log(`Supabase bucket: ${SUPABASE_BUCKET}`);
  console.log(`R2 bucket:       ${R2_BUCKET}`);
  console.log(`Mode:            ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log(`Concurrency:     ${MAX_CONCURRENT}`);
  console.log('');

  const started = Date.now();

  const files = await listAllSupabaseFiles();
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  console.log(
    `Found ${files.length} files totaling ${formatBytes(totalBytes)}\n`,
  );

  if (files.length === 0) {
    console.log('Nothing to mirror. Exiting.');
    return;
  }

  const stats: Stats = {
    total: files.length,
    skipped: 0,
    copied: 0,
    failed: 0,
    bytesCopied: 0,
    errors: [],
  };

  await mirrorWithConcurrency(files, stats);

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  console.log('');
  console.log('='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Mode:          ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Total files:   ${stats.total}`);
  console.log(`Copied:        ${stats.copied}`);
  console.log(`Skipped:       ${stats.skipped} (already in R2)`);
  console.log(`Failed:        ${stats.failed}`);
  console.log(`Bytes copied:  ${formatBytes(stats.bytesCopied)}`);
  console.log(`Elapsed:       ${elapsed}s`);

  if (stats.errors.length > 0) {
    console.log('');
    console.log('Errors:');
    for (const e of stats.errors) {
      console.log(`  - ${e.key}: ${e.error}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
