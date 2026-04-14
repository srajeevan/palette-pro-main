import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/sendEmail.ts";

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "support@palettepro.app";

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
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_ANON_KEY")!,
            { global: { headers: { Authorization: authHeader || "" } } }
        );

        // Get user (may be null for guests)
        const { data: { user } } = await supabaseClient.auth.getUser();

        const { category, message, appVersion, deviceInfo } = await req.json();

        if (!message || !category) {
            return new Response(JSON.stringify({ error: "Message and category are required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Use service role client to insert (so we can set user_email)
        const serviceClient = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const { error: insertError } = await serviceClient.from("feedback").insert({
            user_id: user?.id || null,
            user_email: user?.email || null,
            category,
            message,
            app_version: appVersion || null,
            device_info: deviceInfo || null,
        });

        if (insertError) {
            console.error("Insert error:", insertError);
            return new Response(JSON.stringify({ error: insertError.message }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Send notification email to admin
        const subjectPrefix = category === "bug" ? "[PalettePro Bug]" : "[PalettePro Feedback]";
        const truncatedMessage = message.length > 60 ? message.substring(0, 60) + "..." : message;

        const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f4f4f5; padding: 20px;">
<div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <h2 style="color: #18181b; margin-top: 0;">New ${category === "bug" ? "Bug Report" : "Feedback"}</h2>
    <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #71717a; width: 120px;">Category</td><td style="padding: 8px 0; color: #18181b; font-weight: 600;">${category}</td></tr>
        <tr><td style="padding: 8px 0; color: #71717a;">User</td><td style="padding: 8px 0; color: #18181b;">${user?.email || "Guest (no reply possible)"}</td></tr>
        <tr><td style="padding: 8px 0; color: #71717a;">App Version</td><td style="padding: 8px 0; color: #18181b;">${appVersion || "Unknown"}</td></tr>
        <tr><td style="padding: 8px 0; color: #71717a;">Device</td><td style="padding: 8px 0; color: #18181b;">${deviceInfo ? `${deviceInfo.os} ${deviceInfo.version}` : "Unknown"}</td></tr>
        <tr><td style="padding: 8px 0; color: #71717a;">Time</td><td style="padding: 8px 0; color: #18181b;">${new Date().toISOString()}</td></tr>
    </table>
    <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 16px 0;" />
    <h3 style="color: #18181b;">Message</h3>
    <p style="color: #3f3f46; line-height: 1.6; white-space: pre-wrap;">${message}</p>
</div>
</body>
</html>`;

        try {
            await sendEmail({
                to: [{ email: ADMIN_EMAIL }],
                replyTo: user?.email ? { email: user.email } : undefined,
                subject: `${subjectPrefix} ${truncatedMessage}`,
                htmlContent,
            });
        } catch (emailErr) {
            console.error("Email notification failed:", emailErr);
            // Don't fail the request — feedback is saved
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
