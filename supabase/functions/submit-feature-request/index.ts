import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/sendEmail.ts";

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "support@palettepro.app";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

const BLOCKED_WORDS = [
    'fuck', 'shit', 'ass', 'bitch', 'damn', 'cunt', 'dick', 'cock',
    'nigger', 'nigga', 'faggot', 'retard', 'slut', 'whore',
    'kill yourself', 'kys',
];

function containsBadWords(text: string): boolean {
    const lower = text.toLowerCase();
    return BLOCKED_WORDS.some((word) => lower.includes(word));
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
            },
        });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        const supabaseClient = createClient(
            SUPABASE_URL,
            Deno.env.get("SUPABASE_ANON_KEY")!,
            { global: { headers: { Authorization: authHeader || "" } } }
        );

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Authentication required" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const { title, description } = await req.json();

        if (!title || !description) {
            return new Response(JSON.stringify({ error: "Title and description are required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Word filter check
        if (containsBadWords(title) || containsBadWords(description)) {
            return new Response(JSON.stringify({ error: "Your submission contains inappropriate language. Please revise and try again." }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const serviceClient = createClient(
            SUPABASE_URL,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Insert feature request
        const { data: request, error: insertError } = await serviceClient
            .from("feature_requests")
            .insert({
                user_id: user.id,
                title,
                description,
                status: "pending",
            })
            .select()
            .single();

        if (insertError || !request) {
            console.error("Insert error:", insertError);
            return new Response(JSON.stringify({ error: insertError?.message || "Failed to create request" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Create moderation tokens (approve + reject)
        const { data: tokens, error: tokenError } = await serviceClient
            .from("moderation_tokens")
            .insert([
                { feature_request_id: request.id, action: "approve" },
                { feature_request_id: request.id, action: "reject" },
            ])
            .select();

        if (tokenError) {
            console.error("Token creation error:", tokenError);
        }

        const approveToken = tokens?.find((t: any) => t.action === "approve");
        const rejectToken = tokens?.find((t: any) => t.action === "reject");

        const moderateBaseUrl = `${SUPABASE_URL}/functions/v1/moderate-feature-request`;

        const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f4f4f5; padding: 20px;">
<div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <h2 style="color: #18181b; margin-top: 0;">New Feature Request</h2>
    <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #71717a; width: 120px;">Submitter</td><td style="padding: 8px 0; color: #18181b;">${user.email}</td></tr>
        <tr><td style="padding: 8px 0; color: #71717a;">Time</td><td style="padding: 8px 0; color: #18181b;">${new Date().toISOString()}</td></tr>
    </table>
    <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 16px 0;" />
    <h3 style="color: #18181b;">${title}</h3>
    <p style="color: #3f3f46; line-height: 1.6; white-space: pre-wrap;">${description}</p>
    <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
    <div style="text-align: center;">
        <a href="${moderateBaseUrl}?token=${approveToken?.id}" style="display: inline-block; background: #16a34a; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">✓ Approve</a>
        <a href="${moderateBaseUrl}?token=${rejectToken?.id}" style="display: inline-block; background: #dc2626; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">✗ Reject</a>
    </div>
    <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 16px;">These links expire in 7 days.</p>
</div>
</body>
</html>`;

        try {
            await sendEmail({
                to: [{ email: ADMIN_EMAIL }],
                subject: `[PalettePro Idea] ${title}`,
                htmlContent,
            });
        } catch (emailErr) {
            console.error("Email notification failed:", emailErr);
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error("Function error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
