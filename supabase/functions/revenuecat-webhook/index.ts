
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

console.log("RevenueCat Webhook Function Started");

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
    try {
        const signature = req.headers.get("Authorization");
        // In production, verify the signature matches your RevenueCat secret
        // const REVENUECAT_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
        // if (signature !== REVENUECAT_SECRET) return new Response("Unauthorized", { status: 401 });

        const body = await req.json();
        const event = body.event;

        if (!event) {
            return new Response("No event found", { status: 400 });
        }

        const userId = event.app_user_id; // This should be the Supabase UUID
        const type = event.type; // INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION

        console.log(`Received event ${type} for user ${userId}`);

        // Determine Pro Status based on event
        // Note: RevenueCat events are granular. For full sync, you might trust the entitlement.
        // Simplifying here: Purchase/Renewal -> Pro, Expiration -> Not Pro.
        let isPro = false;

        if (
            type === "INITIAL_PURCHASE" ||
            type === "RENEWAL" ||
            type === "UNCANCELLATION" ||
            type === "PRODUCT_CHANGE"
        ) {
            isPro = true;
        } else if (
            type === "EXPIRATION" ||
            type === "CANCELLATION" // Cancellation usually means "will expire", but some treat as immediate
        ) {
            // Ideally for cancellation we check expiration_at, but for now we'll assume Expiration event handles the actual cutoff.
            // Only EXPIRATION strictly removes access usually.
            if (type === "EXPIRATION") {
                isPro = false;
            } else {
                // Cancellation just means auto-renew is off, usually still Pro until end of period.
                // We might want to keep them as Pro.
                isPro = true;
            }
        }

        // Special Case: Transfer
        // If we only get limited events, we might want to just update the `is_pro` flag.

        // Check if UUID is valid (simple check)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userId)) {
            console.log("User ID is not a valid UUID, skipping database update (Anonymous user?)");
            return new Response("Skipped: Anonymous User", { status: 200 });
        }

        // Update Profile
        const { error } = await supabase
            .from('profiles')
            .update({ is_pro: isPro })
            .eq('id', userId);

        if (error) {
            console.error('Error updating profile:', error);
            throw error;
        }

        // Log the subscription event (optional, for history)
        // await supabase.from('subscriptions').insert({ ... })

        return new Response(JSON.stringify({ success: true, isPro }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        });
    }
});
