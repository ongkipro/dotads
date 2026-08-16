import { app } from "../src/app.ts";

const response = await app.request("http://localhost:8787/api/v1/openapi.json");
if (!response.ok) {
  throw new Error(`OpenAPI export failed with HTTP ${response.status}`);
}

const document = await response.json();
process.stdout.write(`${JSON.stringify(document, null, 2)}\n`);
