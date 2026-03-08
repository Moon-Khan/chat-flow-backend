import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter;
let transporterReady = false;

const getTransporter = async () => {
    if (transporter) return transporter;

    const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
    const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

    if (!emailUser || !emailPass) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("EMAIL_USER and EMAIL_PASS must be set in production");
        }

        // Development fallback: don't fail local signup if SMTP is not configured.
        transporter = nodemailer.createTransport({ jsonTransport: true });
        return transporter;
    }

    transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: emailUser,
            pass: emailPass
        }
    });

    if (!transporterReady) {
        await transporter.verify();
        transporterReady = true;
    }

    return transporter;
};

export const sendVerificationEmail = async (email, code) => {
    if (process.env.NODE_ENV !== "production") {
        console.log(`Verification code for ${email}: ${code}`);
    }

    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || "no-reply@chatflow.com";
    const fromName = process.env.EMAIL_FROM_NAME || "ChatFlow Support";

    const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
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
        await mailTransporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Error sending verification email:", error.message);
        return false;
    }
};
