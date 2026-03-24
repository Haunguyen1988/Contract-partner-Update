import assert from "node:assert/strict";
import { ApiError, apiRequest, fetchWithFallback } from "./api.ts";

async function main() {
  const originalFetch = global.fetch;

  try {
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);

      assert.equal(input, "/api/test");
      assert.equal(headers.get("Authorization"), "Bearer token-123");
      assert.equal(headers.get("Content-Type"), "application/json");

      return new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
        status: 200
      });
    };

    const success = await apiRequest<{ ok: boolean }>("/api/test", { method: "POST", body: JSON.stringify({}) }, "token-123");
    assert.deepEqual(success, { ok: true });

    global.fetch = async () => new Response(JSON.stringify({ message: "Readable server error" }), {
      headers: { "content-type": "application/json" },
      status: 400
    });

    await assert.rejects(
      () => apiRequest("/api/test"),
      (error: unknown) => error instanceof ApiError && error.message === "Readable server error"
    );

    global.fetch = async () => new Response("Gateway temporarily unavailable", {
      headers: { "content-type": "text/plain" },
      status: 502
    });

    const fallback = await fetchWithFallback("/api/test", null, { cached: true }, true);
    assert.equal(fallback.source, "fallback");
    assert.deepEqual(fallback.data, { cached: true });
    assert.equal(fallback.error?.message, "Gateway temporarily unavailable");
  } finally {
    global.fetch = originalFetch;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
