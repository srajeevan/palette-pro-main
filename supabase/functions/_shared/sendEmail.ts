const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

interface EmailContact {
    name?: string;
    email: string;
}

interface SendEmailOptions {
    to: EmailContact[];
    from?: EmailContact;
    replyTo?: EmailContact;
    subject: string;
    htmlContent: string;
}

export async function sendEmail(options: SendEmailOptions) {
    if (!BREVO_API_KEY) {
        throw new Error("Missing BREVO_API_KEY");
    }

    const {
        to,
        from = { name: "Palette Pro", email: "support@palettepro.app" },
        replyTo = { email: "support@palettepro.app" },
        subject,
        htmlContent,
    } = options;

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-key": BREVO_API_KEY,
        },
        body: JSON.stringify({
            sender: { name: from.name, email: from.email },
            to,
            replyTo: { email: replyTo.email },
            subject,
            htmlContent,
        }),
    });

    const data = await res.json();

    if (!res.ok) {
        console.error("Brevo API Error:", data);
        throw new Error(`Brevo API error: ${JSON.stringify(data)}`);
    }

    return data;
}
