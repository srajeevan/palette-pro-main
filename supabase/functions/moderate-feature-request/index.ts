import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
    try {
        const url = new URL(req.url);
        const tokenId = url.searchParams.get("token");

        if (!tokenId) {
            return htmlResponse("Missing token", "No moderation token was provided.", false);
        }

        const serviceClient = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Look up the token
        const { data: token, error: tokenError } = await serviceClient
            .from("moderation_tokens")
            .select("*")
            .eq("id", tokenId)
            .single();

        if (tokenError || !token) {
            return htmlResponse("Invalid Token", "This moderation link is invalid or has already been used.", false);
        }

        if (token.used) {
            return htmlResponse("Already Used", "This moderation action has already been taken.", false);
        }

        if (new Date(token.expires_at) < new Date()) {
            return htmlResponse("Expired", "This moderation link has expired.", false);
        }

        // Update feature request status
        const newStatus = token.action === "approve" ? "approved" : "rejected";
        const { error: updateError } = await serviceClient
            .from("feature_requests")
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq("id", token.feature_request_id);

        if (updateError) {
            console.error("Update error:", updateError);
            return htmlResponse("Error", "Failed to update the feature request. Please try again.", false);
        }

        // Mark ALL sibling tokens (approve + reject for this request) as used
        await serviceClient
            .from("moderation_tokens")
            .update({ used: true })
            .eq("feature_request_id", token.feature_request_id);

        const actionText = token.action === "approve" ? "approved" : "rejected";
        return htmlResponse(
            `Feature Request ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
            `The feature request has been ${actionText} successfully.`,
            token.action === "approve"
        );
    } catch (error) {
        console.error("Function error:", error);
        return htmlResponse("Error", "An unexpected error occurred.", false);
    }
});

function htmlResponse(title: string, message: string, isSuccess: boolean): Response {
    const color = isSuccess ? "#16a34a" : "#dc2626";
    const icon = isSuccess ? "✓" : "✗";

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Palette Pro</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .card { background: #fff; border-radius: 16px; padding: 48px; max-width: 420px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .icon { width: 64px; height: 64px; border-radius: 50%; background: ${color}; color: #fff; font-size: 32px; line-height: 64px; margin: 0 auto 24px; }
        h1 { color: #18181b; font-size: 24px; margin: 0 0 12px; }
        p { color: #52525b; font-size: 16px; line-height: 1.5; margin: 0; }
        .brand { color: #a1a1aa; font-size: 13px; margin-top: 32px; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">${icon}</div>
        <h1>${title}</h1>
        <p>${message}</p>
        <p class="brand">Palette Pro</p>
    </div>
</body>
</html>`;

    return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
        status: 200,
    });
}
