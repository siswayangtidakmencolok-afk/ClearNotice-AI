import test from "node:test";
import assert from "node:assert/strict";
import { chunkDocument } from "../lib/documents/chunk.ts";
import { validateCitations } from "../lib/documents/evidence.ts";
import { rerankChunks } from "../lib/documents/rerank.ts";
import { generateOpenRouterJson } from "../lib/ai/openrouter-provider.ts";
import { parseJsonText, validateJsonSchema } from "../lib/ai/response-validation.ts";
import { answerFromDocuments } from "../lib/ai/document-intelligence.ts";
import { z } from "zod";

test("chunks preserve searchable source text and page references", () => {
  const source = "Applications close on 12 June 2026.\n\nThe notice is fictional.";
  const chunks = chunkDocument({ documentId: "doc-1", documentName: "notice.txt", sourceText: source, paragraphPages: [2, 3] });
  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].pageNumber, 2);
  assert.equal(chunks[1].pageNumber, 3);
  assert.ok(chunks.every((chunk) => source.includes(chunk.text)));
  assert.ok(chunks.every((chunk) => chunk.sourceText === source));
});

test("evidence verifier drops invented, wrong-id, and non-exact citations", () => {
  const chunks = chunkDocument({ documentId: "doc-1", documentName: "notice.txt", sourceText: "Applications close on 12 June 2026." });
  const result = validateCitations({ citations: [
    { chunkId: chunks[0].chunkId, quote: "Applications close on 12 June 2026." },
    { chunkId: chunks[0].chunkId, quote: "Applications close on 13 June 2026." },
    { chunkId: "other:1", quote: "Applications close on 12 June 2026." },
  ] }, chunks);
  assert.equal(result.citations.length, 1);
  assert.equal(result.citations[0].quote, "Applications close on 12 June 2026.");
});

test("Rerank falls back to retrieval order without exposing chunk content", async () => {
  const previousKey = process.env.COHERE_API_KEY;
  delete process.env.COHERE_API_KEY;
  const chunks = chunkDocument({ documentId: "doc-1", documentName: "notice.txt", sourceText: "The grant application closes on 12 June 2026." });
  chunks[0].retrievalScore = 0.7;
  try {
    const result = await rerankChunks("deadline", chunks, "request-test");
    assert.equal(result.status, "fallback");
    assert.equal(result.reason, "not_configured");
    assert.equal(result.items[0].chunkId, chunks[0].chunkId);
    assert.equal(result.items[0].relevanceScore, null);
  } finally {
    if (previousKey === undefined) delete process.env.COHERE_API_KEY;
    else process.env.COHERE_API_KEY = previousKey;
  }
});

test("document analysis requires consent before calling any provider", async () => {
  await assert.rejects(answerFromDocuments("question", [], "request-test", false), (error) => error.category === "consent_required" && error.status === 403);
});

test("JSON parsing and Zod schema validation use the production validation helpers", () => {
  const schema = z.object({ answer: z.string(), count: z.number() });
  const parsed = parseJsonText('```json\n{"answer":"fictional","count":1}\n```');
  assert.equal(parsed.success, true);
  assert.equal(validateJsonSchema(parsed.data, schema).success, true);
  assert.equal(parseJsonText("").reason, "empty");
  assert.equal(parseJsonText('{"answer":"unfinished"').reason, "malformed_or_truncated");
  assert.equal(validateJsonSchema({ answer: 4 }, schema).success, false);
});

test("OpenRouter HTTP statuses retain their distinct categories", async () => {
  const oldKey = process.env.OPENROUTER_API_KEY;
  const oldModel = process.env.OPENROUTER_MODEL;
  process.env.OPENROUTER_API_KEY = "status-test-key";
  process.env.OPENROUTER_MODEL = "openrouter/free";
  const expected = new Map([[400, "invalid_request_or_config"], [401, "authentication_or_permission"], [403, "authentication_or_permission"], [402, "payment_required"], [404, "model_or_endpoint_not_found"], [429, "usage_limit"], [500, "provider_service_failure"], [502, "provider_service_failure"], [503, "provider_service_failure"]]);
  try {
    for (const [status, category] of expected) {
      await assert.rejects(generateOpenRouterJson("rules", "fictional", { type: "object" }, "request-test", async () => new Response(JSON.stringify({ error: { code: "TEST_ERROR" } }), { status })), (error) => error.category === category && error.providerStatus === status);
    }
  } finally {
    if (oldKey === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = oldKey;
    if (oldModel === undefined) delete process.env.OPENROUTER_MODEL; else process.env.OPENROUTER_MODEL = oldModel;
  }
});

test("OpenRouter timeout and DNS failures expose safe stage diagnostics", async () => {
  const oldKey = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = "network-test-key";
  try {
    await assert.rejects(generateOpenRouterJson("rules", "private sentinel", { type: "object" }, "request-test", async () => { throw new DOMException("timed out", "TimeoutError"); }), (error) => error.category === "timeout" && error.errorStage === "timeout" && error.status === 504);
    const dnsError = Object.assign(new TypeError("fetch failed"), { cause: { code: "ENOTFOUND" } });
    await assert.rejects(generateOpenRouterJson("rules", "private sentinel", { type: "object" }, "request-test", async () => { throw dnsError; }), (error) => error.category === "network_dns" && error.errorStage === "dns" && error.providerCode === "ENOTFOUND");
  } finally {
    if (oldKey === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = oldKey;
  }
});

test("OpenRouter rejects unreadable success bodies and uncertain paid model results", async () => {
  const oldKey = process.env.OPENROUTER_API_KEY;
  const oldModel = process.env.OPENROUTER_MODEL;
  process.env.OPENROUTER_API_KEY = "response-test-key";
  process.env.OPENROUTER_MODEL = "openrouter/free";
  try {
    await assert.rejects(generateOpenRouterJson("rules", "fictional", { type: "object" }, "request-test", async () => new Response("not json", { status: 200 })), (error) => error.category === "invalid_response" && error.errorStage === "response");
    await assert.rejects(generateOpenRouterJson("rules", "fictional", { type: "object" }, "request-test", async () => new Response(JSON.stringify({ model: "vendor/model-paid", choices: [{ message: { content: "{}" } }] }), { status: 200 })), (error) => error.category === "invalid_response");
  } finally {
    if (oldKey === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = oldKey;
    if (oldModel === undefined) delete process.env.OPENROUTER_MODEL; else process.env.OPENROUTER_MODEL = oldModel;
  }
});

test("OpenRouter provider-boundary mock maps 429 safely and never logs key or prompt", async () => {
  const oldKey = process.env.OPENROUTER_API_KEY;
  const oldModel = process.env.OPENROUTER_MODEL;
  const secretSentinel = "test_secret_that_must_not_be_logged";
  const promptSentinel = "fictional source text that must not appear in diagnostics";
  process.env.OPENROUTER_API_KEY = secretSentinel;
  process.env.OPENROUTER_MODEL = "openrouter/free";
  const originalInfo = console.info;
  const lines = [];
  console.info = (...args) => lines.push(args.join(" "));
  try {
    await assert.rejects(generateOpenRouterJson("instructions", promptSentinel, { type: "object" }, "test-request", async () => new Response(JSON.stringify({ error: { code: "RATE_LIMITED" } }), { status: 429, headers: { "Content-Type": "application/json" } })), (error) => error.category === "usage_limit" && error.providerStatus === 429);
    assert.ok(lines.length > 0);
    assert.ok(lines.every((line) => !line.includes(secretSentinel) && !line.includes(promptSentinel)));
  } finally {
    console.info = originalInfo;
    if (oldKey === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = oldKey;
    if (oldModel === undefined) delete process.env.OPENROUTER_MODEL; else process.env.OPENROUTER_MODEL = oldModel;
  }
});

test("OpenRouter rejects a paid model identifier", async () => {
  const oldModel = process.env.OPENROUTER_MODEL;
  process.env.OPENROUTER_MODEL = "vendor/model-paid";
  try {
    await assert.rejects(generateOpenRouterJson("instructions", "text", { type: "object" }, "request-test", async () => { throw new Error("must not call network"); }), /OpenRouter model must be/);
  } finally {
    if (oldModel === undefined) delete process.env.OPENROUTER_MODEL; else process.env.OPENROUTER_MODEL = oldModel;
  }
});

test("OpenRouter missing key is a configuration error and does not call fetch", async () => {
  const oldKey = process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  try {
    await assert.rejects(generateOpenRouterJson("instructions", "text", { type: "object" }, "request-test", async () => { throw new Error("must not call network"); }), (error) => error.category === "configuration");
  } finally {
    if (oldKey === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = oldKey;
  }
});

test("OpenRouter success uses only the configured free router and returns its actual model", async () => {
  const oldKey = process.env.OPENROUTER_API_KEY;
  const oldModel = process.env.OPENROUTER_MODEL;
  process.env.OPENROUTER_API_KEY = "provider-boundary-test-key";
  process.env.OPENROUTER_MODEL = "openrouter/free";
  let requestUrl = "";
  let requestBody;
  try {
    const result = await generateOpenRouterJson("instructions", "fictional notice", { type: "object" }, "request-test", async (url, options) => {
      requestUrl = String(url);
      requestBody = JSON.parse(options.body);
      return new Response(JSON.stringify({ model: "google/gemma-example:free", choices: [{ message: { content: JSON.stringify({ answer: "ok" }) } }] }), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    assert.equal(requestUrl, "https://openrouter.ai/api/v1/chat/completions");
    assert.equal(requestBody.model, "openrouter/free");
    assert.equal(requestBody.provider.require_parameters, true);
    assert.equal(requestBody.response_format.type, "json_schema");
    assert.equal(result.modelId, "google/gemma-example:free");
    assert.equal(result.text, "{\"answer\":\"ok\"}");
  } finally {
    if (oldKey === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = oldKey;
    if (oldModel === undefined) delete process.env.OPENROUTER_MODEL; else process.env.OPENROUTER_MODEL = oldModel;
  }
});
