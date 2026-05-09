import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "https://liff.line.me"],
    credentials: true,
  })
);

// Health check — useful for Railway deployment checks
app.get("/health", (c) => {
  return c.json({ status: "ok", service: "arif-clinic-api" });
});

// Route groups (we will add these module by module)
app.get("/", (c) => {
  return c.json({ message: "Arif Clinic API 🏥" });
});

const PORT = Number(process.env.PORT) || 8080;

console.log(`Server running on http://localhost:${PORT}`);

serve({ fetch: app.fetch, port: PORT });

export default app;
