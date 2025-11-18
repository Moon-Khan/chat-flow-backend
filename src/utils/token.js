import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES;


export const signToken = (payload) => {
    console.log("TOKEN", JWT_SECRET);
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}
export const verifyToken = (token) => jwt.verify(token, JWT_SECRET);
