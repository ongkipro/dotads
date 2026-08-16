import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { apiReference } from "@scalar/hono-api-reference";
import { auth } from "@dotads/auth";
import { platformRouter } from "./routes/platform.ts";
import { adminRouter } from "./routes/admin.ts";
import { publicRouter } from "./routes/public.ts";
import { webhooksRouter } from "./routes/webhooks.ts";
import { workspacesRouter } from "./routes/workspaces.ts";
import { catalogRouter } from "./routes/catalog.ts";
import { membersRouter } from "./routes/members.ts";
import { dashboardRouter } from "./routes/dashboard.ts";
import { invitationsRouter } from "./routes/invitations.ts";
import { rateLimitMiddleware } from "./middleware/rate-limit.ts";
import { authMiddleware, type AppEnv } from "./middleware/auth.ts";

export const app = new OpenAPIHono<AppEnv>();

const configuredCorsOrigins = (process.env.DOTADS_CORS_ORIGINS || process.env.BETTER_AUTH_TRUSTED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const developmentCorsOrigins = [
  "http://localhost:3000",
  "http://localhost:3100",
  "http://localhost:4321",
  "http://localhost:8787",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3100",
  "http://127.0.0.1:4321",
  "http://127.0.0.1:8787",
];
const allowedCorsOrigins = new Set(
  process.env.NODE_ENV === "production"
    ? configuredCorsOrigins
    : [...developmentCorsOrigins, ...configuredCorsOrigins]
);

export function resolveCorsOrigin(origin: string): string | undefined {
  return allowedCorsOrigins.has(origin) ? origin : undefined;
}

// Global Rate Limit Middleware & Standard CORS
app.use("*", rateLimitMiddleware);
app.use("*", cors({
  origin: (origin) => resolveCorsOrigin(origin),
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "x-session-token", "x-tenant-id"],
}));

// Global Error Handler
app.onError((err, c) => {
  console.error("Unhandled API Error:", err);
  return c.json({ error: "Internal Server Error" }, 500);
});

// Health check endpoint
app.get("/health", (c) => c.json({ status: "healthy", timestamp: new Date().toISOString() }));

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

const sessionRoute = createRoute({
  method: "get",
  path: "/api/v1/session",
  summary: "Get active tenant session context",
  responses: {
    200: {
      description: "Authenticated tenant session context",
      content: {
        "application/json": {
          schema: z.object({
            userId: z.string(),
            userEmail: z.string().email(),
            tenantId: z.string(),
            organizationId: z.string(),
            role: z.string(),
            tenantName: z.string(),
            tenantStatus: z.string(),
          }),
        },
      },
    },
    409: {
      description: "The authenticated user must explicitly select one of multiple workspaces",
      content: {
        "application/json": {
          schema: z.object({
            error: z.literal("Workspace selection required"),
            code: z.literal("WORKSPACE_SELECTION_REQUIRED"),
            workspaceSelectionRequired: z.literal(true),
          }),
        },
      },
    },
  },
});
app.use("/api/v1/session", authMiddleware);
app.openapi(sessionRoute, async (c) => c.json(c.get("auth"), 200));

// Mount OpenApi Sub-Routers
app.route("/api/v1/platform", platformRouter);
app.route("/api/v1/admin", adminRouter);
app.route("/api/v1/public", publicRouter);
app.route("/api/v1/webhooks", webhooksRouter);
app.route("/api/v1/workspaces", workspacesRouter);
app.route("/api/v1/catalog", catalogRouter);
app.route("/api/v1/members", membersRouter);
app.route("/api/v1/dashboard", dashboardRouter);
app.route("/api/v1/invitations", invitationsRouter);

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
