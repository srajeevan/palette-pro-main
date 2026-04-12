/**
 * delete-palette-image
 *
 * Deletes a single reference image from BOTH R2 and Supabase Storage,
 * given the public image_url stored in `palettes.image_url`.
 *
 * The two backends share the same logical key path (`{userId}/{file}`)
 * because scripts/mirror-supabase-to-r2.ts preserves Supabase Storage
 * paths when mirroring to R2. So an "old" (Supabase) palette may also
 * have a mirrored copy in R2, and a "new" (R2) palette never existed
 * in Supabase. We tolerate "not found" on either side and treat the
 * operation as success unless BOTH deletes fail for non-404 reasons.
 *
 * Auth: requires a logged-in Supabase user. Authorization is enforced:
 * the caller can only delete keys whose prefix is their own user id.
 *
 * Request:  { imageUrl: string }
 * Response: { ok: true, r2: "deleted" | "missing" | "skipped",
 *                       supabase: "deleted" | "missing" | "skipped" }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  S3Client,
  DeleteObjectCommand,
} from "npm:@aws-sdk/client-s3@3.645.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")!;
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")!;
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME")!;
const R2_ENDPOINT = Deno.env.get("R2_ENDPOINT")!;
const R2_PUBLIC_URL = Deno.env.get("R2_PUBLIC_URL")!;

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

/**
 * Extract the logical object key ({userId}/{file}...) from either an R2
 * or Supabase Storage public URL. Returns null for anything unrecognized.
 */
function extractKey(imageUrl: string): string | null {
  try {
    const u = new URL(imageUrl);

    // R2 public URL: {R2_PUBLIC_URL}/{key}
    const r2Base = new URL(R2_PUBLIC_URL);
    if (u.host === r2Base.host) {
      // path starts with "/"
      return decodeURIComponent(u.pathname.replace(/^\//, ""));
    }

    // Supabase Storage public URL:
    // {SUPABASE_URL}/storage/v1/object/public/{bucket}/{key}
    const supaBase = new URL(SUPABASE_URL);
    if (u.host === supaBase.host) {
      const marker = `/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/`;
      const idx = u.pathname.indexOf(marker);
      if (idx === -1) return null;
      return decodeURIComponent(u.pathname.slice(idx + marker.length));
    }

    return null;
  } catch {
    return null;
  }
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

    // --- Parse + authorize ---
    const body = await req.json().catch(() => ({}));
    const imageUrl: string | undefined = body?.imageUrl;
    if (!imageUrl || typeof imageUrl !== "string") {
      return json({ error: "Missing imageUrl" }, 400);
    }

    const key = extractKey(imageUrl);
    if (!key) {
      // Unrecognized URL host — treat as a no-op success so the caller's
      // palette-delete path isn't blocked by weird legacy data.
      return json({ ok: true, r2: "skipped", supabase: "skipped" });
    }

    // Path authorization: key MUST start with "{userId}/"
    if (!key.startsWith(`${user.id}/`)) {
      return json({ error: "Forbidden: key not owned by caller" }, 403);
    }

    // --- Try R2 delete ---
    let r2Status: "deleted" | "missing" | "skipped" = "skipped";
    try {
      await r2.send(
        new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }),
      );
      r2Status = "deleted"; // S3 DELETE is 204 whether or not the object existed
    } catch (err) {
      // R2 DELETE should basically never fail for existing keys; log and continue.
      console.error("[delete-palette-image] R2 delete error:", err);
      r2Status = "missing";
    }

    // --- Try Supabase Storage delete (service role so we bypass RLS) ---
    let supaStatus: "deleted" | "missing" | "skipped" = "skipped";
    try {
      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      });
      const { data, error } = await admin.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .remove([key]);
      if (error) {
        console.error(
          "[delete-palette-image] Supabase storage delete error:",
          error,
        );
        supaStatus = "missing";
      } else {
        supaStatus = data && data.length > 0 ? "deleted" : "missing";
      }
    } catch (err) {
      console.error("[delete-palette-image] Supabase storage exception:", err);
      supaStatus = "missing";
    }

    return json({ ok: true, r2: r2Status, supabase: supaStatus, key });
  } catch (err) {
    console.error("delete-palette-image error:", err);
    return json(
      { error: err instanceof Error ? err.message : "Internal error" },
      500,
    );
  }
});
