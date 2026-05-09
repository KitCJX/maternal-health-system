import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET environment variable is not set");

const JWT_SECRET: string = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

export type JwtPayload = {
  sub: string;   // staff id
  username: string;
  role: string;
};

export function signToken(payload: JwtPayload): string {
  // expiresIn accepts strings like "7d" at runtime; cast needed due to strict ms.StringValue type
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as unknown as number });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
}
