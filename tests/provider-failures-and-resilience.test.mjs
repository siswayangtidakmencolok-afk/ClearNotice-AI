import test from "node:test";
import assert from "node:assert/strict";
import { analyzeWithOpenRouter } from "../lib/ai/analyze-with-openrouter.ts";
import { parseJsonText } from "../lib/ai/response-validation.ts";
import { readJsonResponse, ApiResponseError } from "../lib/read-json-response.ts";

// Design decision: truncated or malformed model JSON is rejected, never "repaired" into a
// partial analysis. A repaired fragment would present missing data as a successful result.

test("parseJsonText rejects truncated JSON instead of repairing it", () => {
  const truncated = '{"overview": {"subject": "Scholarship", "summary": "Full grant for 2026';
  assert.deepEqual(parseJsonText(truncated), { success: false, reason: "malformed_or_truncated" });
});

test("parseJsonText rejects JSON with a trailing comma", () => {
  assert.equal(parseJsonText('{"keyFacts": [{"label": "Fee", "detail": "None"},]}').success, false);
});

test("parseJsonText accepts a complete object wrapped in a markdown code fence", () => {
  const parsed = parseJsonText('```json\n{"overview": {"subject": "Test"}}\n```');
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.overview.subject, "Test");
});

async function withOpenRouterMock(responseFactory, run) {
  const originalFetch = globalThis.fetch;
  const oldKey = process.env.OPENROUTER_API_KEY;
  const oldModel = process.env.OPENROUTER_MODEL;
  process.env.OPENROUTER_API_KEY = "test-only-placeholder";
  delete process.env.OPENROUTER_MODEL;
  globalThis.fetch = async () => responseFactory();
  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
    if (oldKey === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = oldKey;
    if (oldModel === undefined) delete process.env.OPENROUTER_MODEL; else process.env.OPENROUTER_MODEL = oldModel;
  }
}

test("OpenRouter HTTP 200 with truncated JSON content fails at validation, not as a success", async () => {
  const truncatedContent = '{"overview":{"subject":"Beasiswa","category":"Scholarship","summary":"Program beasiswa untuk mahasiswa","audience":"Mahasis';
  await withOpenRouterMock(
    () => new Response(JSON.stringify({ model: "baidu/ernie-5.5-flash-preview:free", choices: [{ message: { content: truncatedContent }, finish_reason: "length" }] }), { status: 200, headers: { "Content-Type": "application/json" } }),
    () => assert.rejects(analyzeWithOpenRouter("Sample notice.", "request-test"), (error) => {
      assert.equal(error.category, "invalid_json");
      assert.equal(error.status, 502);
      assert.equal(error.providerStatus, 200);
      assert.equal(error.errorStage, "validation");
      return true;
    }),
  );
});

test("OpenRouter HTTP 401 is reported as an authentication failure with its real status", async () => {
  await withOpenRouterMock(
    () => new Response(JSON.stringify({ error: { message: "No auth credentials found", code: 401 } }), { status: 401, headers: { "Content-Type": "application/json" } }),
    () => assert.rejects(analyzeWithOpenRouter("Sample notice.", "request-test"), (error) => {
      assert.equal(error.category, "authentication_or_permission");
      assert.equal(error.status, 401);
      assert.equal(error.providerStatus, 401);
      assert.equal(error.errorStage, "http");
      return true;
    }),
  );
});

test("readJsonResponse turns a platform HTML error page into a clear error", async () => {
  const response = new Response("<HTML><HEAD><TITLE>Error</TITLE></HEAD><BODY>Gateway Timeout</BODY></HTML>", {
    status: 504, headers: { "Content-Type": "text/html", "x-nf-request-id": "nf-123" },
  });
  await assert.rejects(readJsonResponse(response, "Analysis failed."), (error) => {
    assert.ok(error instanceof ApiResponseError);
    assert.equal(error.status, 504);
    assert.equal(error.requestId, "nf-123");
    assert.match(error.message, /HTTP 504/);
    assert.doesNotMatch(error.message, /Unexpected token/);
    return true;
  });
});

test("readJsonResponse surfaces the API's JSON error message for non-2xx responses", async () => {
  const response = new Response(JSON.stringify({ error: "OpenRouter returned malformed or truncated JSON. Retry the analysis.", category: "invalid_json" }), {
    status: 502, headers: { "Content-Type": "application/json", "x-request-id": "req-1" },
  });
  await assert.rejects(readJsonResponse(response, "Analysis failed."), (error) => {
    assert.equal(error.status, 502);
    assert.match(error.message, /malformed or truncated JSON/);
    return true;
  });
});

test("readJsonResponse rejects a JSON content type with an unreadable body", async () => {
  const response = new Response("{not json", { status: 200, headers: { "Content-Type": "application/json" } });
  await assert.rejects(readJsonResponse(response, "Analysis failed."), /unreadable JSON/);
});

test("readJsonResponse returns the payload for a successful JSON response", async () => {
  const response = new Response(JSON.stringify({ analysis: { ok: true } }), { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } });
  assert.deepEqual(await readJsonResponse(response, "Analysis failed."), { analysis: { ok: true } });
});

test("OpenRouter default sends an ordered free-only model list and accepts a listed model", async () => {
  let body;
  await withOpenRouterMock(() => null, async () => {
    const { generateOpenRouterJson } = await import("../lib/ai/openrouter-provider.ts");
    const result = await generateOpenRouterJson("rules", "notice", { type: "object" }, "request-test", async (url, options) => {
      body = JSON.parse(options.body);
      return new Response(JSON.stringify({ model: body.models[1], choices: [{ message: { content: "{}" }, finish_reason: "stop" }] }), { status: 200 });
    });
    assert.equal(body.model, undefined);
    assert.ok(body.models.length >= 2 && body.models.every((model) => model.endsWith(":free")));
    assert.equal(result.modelId, body.models[1]);
    assert.equal(result.finishReason, "stop");
  });
});

test("OpenRouter rejects a returned model that is not in the configured free list", async () => {
  await withOpenRouterMock(() => null, async () => {
    const { generateOpenRouterJson } = await import("../lib/ai/openrouter-provider.ts");
    await assert.rejects(generateOpenRouterJson("rules", "notice", { type: "object" }, "request-test", async () =>
      new Response(JSON.stringify({ model: "vendor/other-model:free", choices: [{ message: { content: "{}" } }] }), { status: 200 })),
    (error) => error.category === "invalid_response");
  });
});

test("OpenRouter rejects more than three configured models or any non-free entry", async () => {
  const { getOpenRouterModels } = await import("../lib/ai/openrouter-provider.ts");
  const old = process.env.OPENROUTER_MODEL;
  try {
    process.env.OPENROUTER_MODEL = "a/b:free, c/d";
    assert.throws(() => getOpenRouterModels(), /:free/);
    process.env.OPENROUTER_MODEL = "a/b:free,c/d:free,e/f:free,g/h:free";
    assert.throws(() => getOpenRouterModels(), /:free/);
    process.env.OPENROUTER_MODEL = " a/b:free , c/d:free ";
    assert.deepEqual(getOpenRouterModels(), ["a/b:free", "c/d:free"]);
  } finally {
    if (old === undefined) delete process.env.OPENROUTER_MODEL; else process.env.OPENROUTER_MODEL = old;
  }
});

test("Reasoning that exhausts the token budget yields a clear error, not a partial result", async () => {
  await withOpenRouterMock(
    () => new Response(JSON.stringify({ model: "baidu/ernie-5.5-flash-preview:free", choices: [{ message: { content: "" }, finish_reason: "length" }] }), { status: 200 }),
    () => assert.rejects(analyzeWithOpenRouter("Sample notice.", "request-test"), (error) => {
      assert.equal(error.category, "invalid_response");
      assert.match(error.message, /output budget/);
      return true;
    }),
  );
});

test("Truncated JSON with finish_reason=length names the cause and is rejected", async () => {
  await withOpenRouterMock(
    () => new Response(JSON.stringify({ model: "baidu/ernie-5.5-flash-preview:free", choices: [{ message: { content: '{"overview":{"subject":"Beasi' }, finish_reason: "length" }] }), { status: 200 }),
    () => assert.rejects(analyzeWithOpenRouter("Sample notice.", "request-test"), (error) => {
      assert.equal(error.category, "invalid_json");
      assert.match(error.message, /output limit/);
      return true;
    }),
  );
});

test("OpenRouter account-wide free daily limit is reported with its reset time, not as a generic 429", async () => {
  const body = { error: { message: "Rate limit exceeded: free-models-per-day. Add credits: https://example.invalid", code: 429, metadata: { limit_source: "openrouter_free_tier_daily", headers: { "X-RateLimit-Limit": "50", "X-RateLimit-Remaining": "0", "X-RateLimit-Reset": "1795824000000" } } } };
  await withOpenRouterMock(
    () => new Response(JSON.stringify(body), { status: 429, headers: { "Content-Type": "application/json" } }),
    () => assert.rejects(analyzeWithOpenRouter("Sample notice.", "request-test"), (error) => {
      assert.equal(error.status, 429);
      assert.equal(error.providerCode, "FREE_TIER_DAILY_LIMIT");
      assert.match(error.message, /daily request limit for this server \(50 requests per day\)/);
      assert.match(error.message, /2026-11-28T00:00:00Z/);
      assert.doesNotMatch(error.message, /example\.invalid/);
      return true;
    }),
  );
});

test("A per-model upstream 429 keeps the generic rate-limit message", async () => {
  await withOpenRouterMock(
    () => new Response(JSON.stringify({ error: { code: 429, metadata: { raw: "temporarily rate-limited upstream" } } }), { status: 429 }),
    () => assert.rejects(analyzeWithOpenRouter("Sample notice.", "request-test"), (error) => error.category === "usage_limit" && /free model limit reached/.test(error.message)),
  );
});
