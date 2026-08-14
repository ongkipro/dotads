import { serve } from "@hono/node-server";
import { app } from "./app.ts";

const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "0.0.0.0";

console.log(`🚀 Starting DotAds v2 OpenAPI Server on http://${host}:${port}`);
console.log(`📄 Scalar OpenAPI Documentation: http://${host}:${port}/api/v1/docs`);
console.log(`🔍 OpenAPI JSON Specification: http://${host}:${port}/api/v1/openapi.json`);

serve({
  fetch: app.fetch,
  hostname: "0.0.0.0",
  port,
});
