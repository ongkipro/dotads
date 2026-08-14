import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { platformRouter } from "./routes/platform.ts";
import { adminRouter } from "./routes/admin.ts";
import { publicRouter } from "./routes/public.ts";
import { webhooksRouter } from "./routes/webhooks.ts";
import { rateLimitMiddleware } from "./middleware/rate-limit.ts";
import type { AppEnv } from "./middleware/auth.ts";

export const app = new OpenAPIHono<AppEnv>();

// Global Rate Limit Middleware & CORS
app.use("*", rateLimitMiddleware);
app.use("*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-session-token, x-tenant-id");
  if (c.req.method === "OPTIONS") {
    return c.body(null, 204);
  }
  await next();
});

// Health check endpoint
app.get("/health", (c) => c.json({ status: "healthy", timestamp: new Date().toISOString() }));

// Mount OpenApi Sub-Routers
app.route("/api/v1/platform", platformRouter);
app.route("/api/v1/admin", adminRouter);
app.route("/api/v1/public", publicRouter);
app.route("/api/v1/webhooks", webhooksRouter);

// Configure OpenAPI 3.1 Specification JSON
app.doc("/api/v1/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "DotAds v2 Headless API Spec",
    version: "2.0.0",
    description: "High-Performance Multi-Tenant Direct-Response Headless API Spec for Super Admin, Tenant Admin, Storefronts & Builders",
  },
  servers: [{ url: "http://localhost:8787" }],
});

// Serve Interactive Scalar API Reference UI
app.get("/api/v1/docs", apiReference({
  spec: { url: "/api/v1/openapi.json" },
  theme: "purple",
}));
