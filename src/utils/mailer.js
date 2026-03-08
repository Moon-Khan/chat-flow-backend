export const sendVerificationEmail = async (email, code) => {
    if (process.env.NODE_ENV !== "production") {
        console.log(`[DEV] Verification code for ${email}: ${code}`);
    }

    const apiKey = process.env.MAILERSEND_API_KEY;
    if (!apiKey) {
        if (process.env.NODE_ENV === "production") {
            console.error("MAILERSEND_API_KEY is missing in production");
            return false;
        }

        // Local development fallback when MailerSend is not configured.
        return true;
    }

    const fromEmail = process.env.EMAIL_FROM || "no-reply@example.com";
    const fromName = process.env.EMAIL_FROM_NAME || "ChatFlow Support";

    const payload = {
        from: {
            email: fromEmail,
            name: fromName
        },
        to: [
            {
                email
            }
        ],
        subject: "Verify your ChatFlow account",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #4F46E5; text-align: center;">Welcome to ChatFlow!</h2>
                <p>Hello,</p>
                <p>Thank you for signing up. Please use the following verification code to complete your registration:</p>
                <div style="background: #F3F4F6; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
                    <h1 style="letter-spacing: 5px; color: #111827; margin: 0;">${code}</h1>
                </div>
                <p>This code will expire in <strong>2 minutes</strong>.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #6B7280; text-align: center;">&copy; 2026 ChatFlow App. All rights reserved.</p>
            </div>
        `
    };

    try {
        const response = await fetch("https://api.mailersend.com/v1/email", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "content-type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`MailerSend error: ${response.status} ${errorBody}`);
            return false;
        }

        console.log("Email sent via MailerSend");
        return true;
    } catch (error) {
        console.error("Email send failed:", error.message);
        return false;
    }
};
