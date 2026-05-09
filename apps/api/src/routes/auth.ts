import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, staff } from "@repo/db";
import { signToken } from "../lib/jwt.js";
import { authMiddleware, type AuthVariables } from "../middleware/auth.js";

const auth = new Hono<{ Variables: AuthVariables }>();

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8, "Password must be at least 8 characters"),
  nameTh: z.string().min(1),
  nameEn: z.string().optional(),
  role: z.enum(["admin", "staff"]).default("staff"),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// POST /auth/register — create a staff account
auth.post("/register", zValidator("json", registerSchema), async (c) => {
  const body = c.req.valid("json");

  const existing = await db
    .select({ id: staff.id })
    .from(staff)
    .where(eq(staff.username, body.username))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ error: "Username already taken" }, 409);
  }

  const passwordHash = await bcrypt.hash(body.password, 12);

  const [created] = await db
    .insert(staff)
    .values({
      username: body.username,
      passwordHash,
      nameTh: body.nameTh,
      nameEn: body.nameEn,
      role: body.role,
    })
    .returning({
      id: staff.id,
      username: staff.username,
      nameTh: staff.nameTh,
      role: staff.role,
    });

  return c.json(created, 201);
});

// POST /auth/login — validate credentials, return JWT
auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const { username, password } = c.req.valid("json");

  const [member] = await db
    .select()
    .from(staff)
    .where(eq(staff.username, username))
    .limit(1);

  if (!member || !(await bcrypt.compare(password, member.passwordHash))) {
    return c.json({ error: "Invalid username or password" }, 401);
  }

  const token = signToken({
    sub: member.id,
    username: member.username,
    role: member.role,
  });

  return c.json({
    token,
    user: {
      id: member.id,
      username: member.username,
      nameTh: member.nameTh,
      role: member.role,
    },
  });
});

// GET /auth/me — return current user (protected)
auth.get("/me", authMiddleware, (c) => {
  return c.json({ user: c.get("user") });
});

export { auth };
