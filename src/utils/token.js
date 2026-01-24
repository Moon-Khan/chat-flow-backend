import jwt from "jsonwebtoken";

// Constants moved inside functions for safety


export const signToken = (payload) => {
    // Read secret dynamically to avoid load-order issues
    const secret = process.env.JWT_SECRET;
    console.log(`[DEBUG] Signing token. Secret length: ${secret ? secret.length : 'N/A'}, Preview: ${secret ? secret.substring(0, 3) + '...' : 'NONE'}`);

    if (!secret) console.error("CRITICAL: JWT_SECRET is missing during signToken");
    return jwt.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRES });
}

export const verifyToken = (token) => {
    const secret = process.env.JWT_SECRET;
    console.log(`[DEBUG] Verifying token. Secret length: ${secret ? secret.length : 'N/A'}, Preview: ${secret ? secret.substring(0, 3) + '...' : 'NONE'}`);

    if (!secret) console.error("CRITICAL: JWT_SECRET is missing during verifyToken");
    return jwt.verify(token, secret);
}
