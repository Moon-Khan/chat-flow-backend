import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter;

const getTransporter = async () => {
    if (transporter) return transporter;

    // Use environment variables if provided
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    } else {
        // Create a test account (Ethereal) dynamically for development
        console.log("Creating test email account for development...");
        try {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            console.log("Ethereal account created: " + testAccount.user);
        } catch (err) {
            console.error("Failed to create test email account, using mock transporter.", err);
            // Fallback mock transporter that just logs to console
            transporter = {
                sendMail: async (options) => {
                    console.log("--- MOCK EMAIL SENT ---");
                    console.log("To:", options.to);
                    console.log("Subject:", options.subject);
                    return { messageId: "mock-id" };
                }
            };
        }
    }
    return transporter;
};

export const sendVerificationEmail = async (email, code) => {
    // ALWAYS log the code to console first! This ensures the user can see it even if email fails.
    console.log(`\n==============================================`);
    console.log(`VERIFICATION CODE FOR ${email}: ${code}`);
    console.log(`==============================================\n`);

    const mailOptions = {
        from: '"ChatFlow Support" <no-reply@chatflow.com>',
        to: email,
        subject: 'Verify your ChatFlow account',
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
        const mailTransporter = await getTransporter();
        const info = await mailTransporter.sendMail(mailOptions);

        if (info.messageId !== "mock-id" && !process.env.SMTP_HOST) {
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }
        return true;
    } catch (error) {
        console.error("Error sending verification email (already logged code to console):", error.message);
        return false;
    }
};
