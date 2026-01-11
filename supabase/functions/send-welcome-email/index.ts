import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const PREVIEW_TEXT = "Welcome to your new digital studio.";

const EMAIL_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Palette Pro</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #18181b; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background-color: #000000; padding: 40px; text-align: center; }
        .logo { font-family: 'Times New Roman', serif; font-size: 28px; font-weight: bold; color: #ffffff; letter-spacing: 1px; }
        .content { padding: 40px; }
        h1 { font-family: 'Times New Roman', serif; font-size: 32px; font-weight: bold; margin-bottom: 24px; color: #18181b; }
        p { line-height: 1.6; font-size: 16px; color: #52525b; margin-bottom: 20px; }
        .cta-button { display: inline-block; background-color: #000000; color: #ffffff; font-weight: 600; padding: 14px 32px; border-radius: 8px; text-decoration: none; margin-top: 10px; }
        .footer { background-color: #fafafa; padding: 24px; text-align: center; font-size: 12px; color: #a1a1aa; border-top: 1px solid #e4e4e7; }
        .accent { color: #d946ef; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Palette Pro</div>
        </div>
        <div class="content">
            <h1>Welcome to the Studio</h1>
            <p>Hello,</p>
            <p>You've successfully unlocked your new digital canvas. <br/>Palette Pro is designed to bridge the gap between digital inspiration and physical creation.</p>
            <p>Here is what you can do right now:</p>
            <ul>
                <li><strong>Analyze</strong> any photo to extract precise oil pigments.</li>
                <li><strong>Mix</strong> virtual paints to see real-world results.</li>
                <li><strong>Save</strong> your favorite palettes for future masterpieces.</li>
            </ul>
            <p>We can't wait to see what you create.</p>
            <div style="text-align: center; margin-top: 32px;">
                <a href="https://palettepro.app" class="cta-button">Open Studio</a>
            </div>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Palette Pro. All rights reserved.</p>
            <p>Questions? Reply to this email.</p>
        </div>
    </div>
</body>
</html>
`;

serve(async (req) => {
    // 1. Secret Key Check
    if (!RESEND_API_KEY) {
        console.error("Missing RESEND_API_KEY");
        return new Response("Internal Server Error: Missing API Key", { status: 500 });
    }

    // 2. Parse Webhook Payload
    try {
        const payload = await req.json();
        console.log("Webhook Payload:", JSON.stringify(payload));

        // Auth.users INSERT payload structure
        // type: 'INSERT', table: 'users', schema: 'auth', record: { email: '...', ... }
        const record = payload.record;

        if (!record || !record.email) {
            console.warn("No email found in payload record");
            return new Response("No email found", { status: 400 });
        }

        const userEmail = record.email;
        const userName = record.raw_user_meta_data?.full_name || "Artist";

        // 2.5. delay for 45 seconds to let Auth email land first
        // (Note: Supabase Edge Functions timeout is ~60s, so keeping this under that limit)
        console.log("Waiting 45 seconds before sending...");
        await new Promise(resolve => setTimeout(resolve, 45000));

        // 3. Send Email via Resend
        console.log(`Sending email to ${userEmail}...`);

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Palette Pro <welcome@support.palettepro.app>", // Ensure this matches your verfied domain
                to: userEmail,
                subject: "Welcome to your Digital Studio 🎨",
                html: EMAIL_HTML,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Resend API Error:", data);
            return new Response(JSON.stringify(data), { status: 400 });
        }

        console.log("Email sent successfully:", data);

        return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }
});
