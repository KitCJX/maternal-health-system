import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./routes/auth.js";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "https://liff.line.me"],
    credentials: true,
  })
);

app.get("/health", (c) => {
  return c.json({ status: "ok", service: "arif-clinic-api" });
});

app.route("/auth", auth);

const PORT = Number(process.env.PORT) || 8080;
console.log(`Server running on http://localhost:${PORT}`);
serve({ fetch: app.fetch, port: PORT });

export default app;
