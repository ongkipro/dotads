import assert from "node:assert/strict";
import { requestSignOut, SIGN_OUT_PATH } from "../src/lib/sign-out.ts";

let captured: { url: string; init?: RequestInit } | null = null;
const fetcher = (async (url: string | URL | Request, init?: RequestInit) => {
  captured = { url: String(url), init };
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}) as typeof fetch;

assert.equal((await requestSignOut(fetcher)).status, 200);
assert.equal(captured?.url, SIGN_OUT_PATH);
assert.equal(captured?.init?.method, "POST");
assert.equal(captured?.init?.credentials, "same-origin");
assert.deepEqual(captured?.init?.headers, { "content-type": "application/json" });
assert.equal(captured?.init?.body, "{}");

console.log("SIGN-OUT REQUEST SHAPE SMOKE TEST PASSED");
