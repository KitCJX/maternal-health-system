import { createMiddleware } from "hono/factory";
import { verifyToken, type JwtPayload } from "../lib/jwt.js";

export type AuthVariables = {
  user: JwtPayload;
};

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const header = c.req.header("Authorization");
    if (!header?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      const payload = verifyToken(header.slice(7));
      c.set("user", payload);
      await next();
    } catch {
      return c.json({ error: "Invalid or expired token" }, 401);
    }
  }
);
