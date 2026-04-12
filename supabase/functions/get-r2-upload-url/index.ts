/**
 * get-r2-upload-url
 *
 * Returns a short-lived presigned PUT URL for uploading a reference image
 * directly to Cloudflare R2. The mobile app calls this function, then PUTs
 * the image bytes to the returned URL. The R2 secret never leaves the server.
 *
 * Auth: requires a logged-in Supabase user (verified via Authorization header).
 *
 * Key path: {userId}/{timestamp}-{shortUuid}.jpeg
 *
 * Response: { uploadUrl, publicUrl, key }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3@3.645.0";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3.645.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID")!;
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")!;
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")!;
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME")!;
const R2_ENDPOINT = Deno.env.get("R2_ENDPOINT")!;
const R2_PUBLIC_URL = Deno.env.get("R2_PUBLIC_URL")!;

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    // --- Auth: verify the caller is a logged-in Supabase user ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header" }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return json({ error: "Unauthorized" }, 401);
    }

    // --- Generate object key scoped to this user ---
    const timestamp = Date.now();
    const shortId = crypto.randomUUID().split("-")[0];
    const key = `${user.id}/${timestamp}-${shortId}.jpeg`;

    // --- Presign a PUT URL (expires in 5 minutes) ---
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: "image/jpeg",
    });

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
    const publicUrl = `${R2_PUBLIC_URL}/${key}`;

    return json({ uploadUrl, publicUrl, key });
  } catch (err) {
    console.error("get-r2-upload-url error:", err);
    return json(
      { error: err instanceof Error ? err.message : "Internal error" },
      500,
    );
  }
});
