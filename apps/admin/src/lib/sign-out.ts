export const SIGN_OUT_PATH = "/api/auth/sign-out";

export async function requestSignOut(fetcher: typeof fetch = fetch): Promise<Response> {
  return fetcher(SIGN_OUT_PATH, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
}
