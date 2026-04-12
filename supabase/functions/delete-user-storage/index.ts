/**
 * delete-user-storage
 *
 * Deletes every object under the authenticated user's `{userId}/` prefix
 * from BOTH Cloudflare R2 and Supabase Storage (`reference-images` bucket).
 *
 * Called by the client during account deletion, BEFORE invoking the
 * `delete_user` RPC (which wipes auth.users and thus invalidates the JWT).
 *
 * Auth: requires a logged-in Supabase user. The user id is taken from the
 * JWT — callers cannot specify which folder to delete. This means the
 * function is always safe: it can only delete the caller's own objects.
 *
 * Idempotent: safe to re-run. Tolerates "not found" on either backend.
 *
 * Request:  {} (no body needed; user id comes from JWT)
 * Response: { ok: true, r2Deleted: number, supabaseDeleted: number }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "npm:@aws-sdk/client-s3@3.645.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")!;
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")!;
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME")!;
const R2_ENDPOINT = Deno.env.get("R2_ENDPOINT")!;

const SUPABASE_STORAGE_BUCKET = "reference-images";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const r2 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/** List every key under `{prefix}` in the R2 bucket, paging as needed. */
async function listAllR2Keys(prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined = undefined;
  do {
    const resp: any = await r2.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );
    for (const obj of resp.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key);
    }
    continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
  } while (continuationToken);
  return keys;
}

/** List every object path under `{prefix}` in the Supabase Storage bucket. */
async function listAllSupabaseKeys(
  admin: ReturnType<typeof createClient>,
  prefix: string,
): Promise<string[]> {
  // Supabase storage .list() is non-recursive; for `{userId}/` we expect a
  // flat layout (files directly under the user's folder), which matches
  // both the mirror script and the new upload path.
  const { data, error } = await admin.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .list(prefix.replace(/\/$/, ""), { limit: 1000 });
  if (error) {
    console.error("[delete-user-storage] list error:", error);
    return [];
  }
  return (data ?? [])
    .filter((entry) => entry.name && !entry.id?.endsWith("/"))
    .map((entry) => `${prefix}${entry.name}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    // --- Auth ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const prefix = `${user.id}/`;

    // --- R2: list and batch-delete ---
    let r2Deleted = 0;
    try {
      const r2Keys = await listAllR2Keys(prefix);
      if (r2Keys.length > 0) {
        // DeleteObjects supports up to 1000 keys per call.
        for (let i = 0; i < r2Keys.length; i += 1000) {
          const chunk = r2Keys.slice(i, i + 1000);
          const resp: any = await r2.send(
            new DeleteObjectsCommand({
              Bucket: R2_BUCKET_NAME,
              Delete: {
                Objects: chunk.map((Key) => ({ Key })),
                Quiet: true,
              },
            }),
          );
          const failed = resp?.Errors?.length ?? 0;
          r2Deleted += chunk.length - failed;
          if (failed > 0) {
            console.error(
              "[delete-user-storage] R2 delete errors:",
              resp.Errors,
            );
          }
        }
      }
    } catch (err) {
      console.error("[delete-user-storage] R2 phase failed:", err);
    }

    // --- Supabase Storage: list and batch-delete (service role bypasses RLS) ---
    let supabaseDeleted = 0;
    try {
      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      });
      const supaKeys = await listAllSupabaseKeys(admin, prefix);
      if (supaKeys.length > 0) {
        const { data, error } = await admin.storage
          .from(SUPABASE_STORAGE_BUCKET)
          .remove(supaKeys);
        if (error) {
          console.error(
            "[delete-user-storage] Supabase remove error:",
            error,
          );
        } else {
          supabaseDeleted = data?.length ?? 0;
        }
      }
    } catch (err) {
      console.error("[delete-user-storage] Supabase phase failed:", err);
    }

    return json({ ok: true, r2Deleted, supabaseDeleted });
  } catch (err) {
    console.error("delete-user-storage error:", err);
    return json(
      { error: err instanceof Error ? err.message : "Internal error" },
      500,
    );
  }
});
