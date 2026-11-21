import * as Sentry from "@sentry/nextjs";
import { AIProviderError, type AIErrorCategory, type AIErrorStage } from "./types.ts";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openrouter/free";
const REQUEST_TIMEOUT_MS = 45_000;

type JsonSchema = Record<string, unknown>;
export type OpenRouterJsonResult = { text: string; modelId: string };

export function getOpenRouterModelId() {
  const model = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;
  if (model === DEFAULT_MODEL || /^[a-z0-9_.-]+\/[a-z0-9_.-]+:free$/i.test(model)) return model;
  throw new AIProviderError("OpenRouter model must be openrouter/free or an explicit :free model.", "openrouter", "configuration", 503, undefined, undefined, "configuration");
}

function categoryForStatus(status: number): AIErrorCategory {
  if (status === 400 || status === 422) return "invalid_request_or_config";
  if (status === 401 || status === 403) return "authentication_or_permission";
  if (status === 402) return "payment_required";
  if (status === 404) return "model_or_endpoint_not_found";
  if (status === 408 || status === 504) return "timeout";
  if (status === 429) return "usage_limit";
  if (status >= 500) return "provider_service_failure";
  return "invalid_response";
}

function apiStatus(category: AIErrorCategory, providerStatus: number) {
  if (category === "authentication_or_permission" || category === "payment_required") return providerStatus;
  if (category === "usage_limit") return 429;
  if (category === "timeout") return 504;
  if (category === "invalid_request_or_config") return 400;
  if (category === "model_or_endpoint_not_found") return 404;
  if (category === "provider_service_failure" && [500, 502, 503].includes(providerStatus)) return providerStatus;
  return 502;
}

function safeErrorCode(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("error" in payload)) return undefined;
  const error = payload.error;
  if (!error || typeof error !== "object" || !("code" in error)) return undefined;
  const code = error.code;
  return typeof code === "string" && /^[A-Z][A-Z0-9_]{1,63}$/.test(code) ? code : undefined;
}

function logDiagnostic(values: {
  requestId: string;
  modelId: string;
  durationMs: number;
  providerStatus?: number;
  category: string;
  errorStage?: AIErrorStage;
  errorType?: string;
  errorCode?: string;
}) {
  console.info("[OpenRouter diagnostic]", JSON.stringify(values));
}

function closeSchema(input: JsonSchema): JsonSchema {
  const definitions = input.$defs && typeof input.$defs === "object" ? input.$defs as Record<string, JsonSchema> : {};
  const visit = (schema: unknown, depth = 0): unknown => {
    if (!schema || typeof schema !== "object" || depth > 20) return schema;
    const value = schema as JsonSchema;
    if (typeof value.$ref === "string" && value.$ref.startsWith("#/$defs/")) {
      const definition = definitions[value.$ref.slice("#/$defs/".length)];
      return definition ? visit(definition, depth + 1) : schema;
    }
    const output: JsonSchema = { ...value };
    if (value.properties && typeof value.properties === "object") {
      output.properties = Object.fromEntries(Object.entries(value.properties as Record<string, unknown>).map(([key, child]) => [key, visit(child, depth + 1)]));
    }
    if (value.items) output.items = visit(value.items, depth + 1);
    if (value.type === "object") output.additionalProperties = false;
    delete output.$defs;
    delete output.$ref;
    return output;
  };
  return visit(input) as JsonSchema;
}

function publicProviderMessage(category: AIErrorCategory, status: number) {
  switch (category) {
    case "invalid_request_or_config": return `OpenRouter rejected the request configuration (HTTP ${status}).`;
    case "authentication_or_permission": return `OpenRouter authentication or permission failed (HTTP ${status}).`;
    case "payment_required": return "OpenRouter returned HTTP 402. ClearNotice is restricted to free models and will not purchase credits or use a paid model.";
    case "model_or_endpoint_not_found": return `The configured OpenRouter model or endpoint was not found (HTTP ${status}).`;
    case "usage_limit": return "OpenRouter free model limit reached (HTTP 429). Try again later.";
    case "timeout": return "OpenRouter did not respond before its request timeout.";
    default: return `OpenRouter free model service failed (HTTP ${status}).`;
  }
}

function parseAssistantContent(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.flatMap((part) => part && typeof part === "object" && "text" in part && typeof part.text === "string" ? [part.text] : []).join("\n").trim();
  return "";
}

function networkFailure(error: unknown): { category: AIErrorCategory; stage: AIErrorStage; errorType: string; errorCode?: string } {
  const chain: Array<{ name?: string; code?: string }> = [];
  const pending: unknown[] = [error];
  const seen = new Set<unknown>();
  while (pending.length && chain.length < 12) {
    const current = pending.shift();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);
    const item = current as { name?: unknown; code?: unknown; cause?: unknown; errors?: unknown };
    chain.push({ name: typeof item.name === "string" ? item.name : undefined, code: typeof item.code === "string" ? item.code : undefined });
    if (item.cause) pending.push(item.cause);
    if (Array.isArray(item.errors)) pending.push(...item.errors);
  }
  const codes = chain.map((item) => item.code ?? "").filter(Boolean);
  const names = chain.map((item) => item.name ?? "").filter(Boolean);
  const code = codes.find((item) => /^[A-Z0-9_]{2,48}$/.test(item));
  const namesForPattern = [...codes, ...names].join(" ").toUpperCase();
  if (/TIMEOUT|ETIMEDOUT|ABORT/.test(namesForPattern)) return { category: "timeout", stage: "timeout", errorType: names[0] || "TimeoutError", errorCode: code };
  if (/ENOTFOUND|EAI_AGAIN|EAI_FAIL/.test(namesForPattern)) return { category: "network_dns", stage: "dns", errorType: names[0] || "NetworkError", errorCode: code };
  if (/CERT_|ERR_TLS|TLS_|SELF_SIGNED|UNABLE_TO_VERIFY|DEPTH_ZERO/.test(namesForPattern)) return { category: "network_tls", stage: "tls", errorType: names[0] || "TLSFailure", errorCode: code };
  if (/ECONNREFUSED/.test(namesForPattern)) return { category: "network_refused", stage: "connect", errorType: names[0] || "ConnectionRefused", errorCode: code };
  if (/EACCES|EPERM/.test(namesForPattern)) return { category: "network_blocked", stage: "blocked", errorType: names[0] || "NetworkBlocked", errorCode: code };
  if (/EHOSTUNREACH|ENETUNREACH|ECONNRESET|EPIPE|UND_ERR_CONNECT/.test(namesForPattern)) return { category: "network", stage: "connect", errorType: names[0] || "NetworkError", errorCode: code };
  return { category: "network", stage: "request", errorType: names[0] || "NetworkError", errorCode: code };
}

export async function generateOpenRouterJson(
  systemInstruction: string,
  userContent: string,
  schema: JsonSchema,
  requestId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<OpenRouterJsonResult> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const modelId = getOpenRouterModelId();
  if (!apiKey) throw new AIProviderError("OpenRouter is not configured on the server.", "openrouter", "configuration", 503, undefined, undefined, "configuration");
  const startedAt = performance.now();
  Sentry.getIsolationScope().setTag("ai_provider", "openrouter");
  try {
    const response = await fetchImpl(OPENROUTER_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-OpenRouter-Title": "ClearNotice AI" },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userContent },
        ],
        temperature: 0.1,
        max_tokens: 6000,
        provider: { require_parameters: true },
        response_format: { type: "json_schema", json_schema: { name: "clearnotice_analysis", strict: true, schema: closeSchema(schema) } },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
    let payload: unknown;
    try { payload = await response.json(); }
    catch (error) {
      const failure = networkFailure(error);
      const timedOut = failure.category === "timeout";
      const category: AIErrorCategory = timedOut ? "timeout" : response.ok ? "invalid_response" : categoryForStatus(response.status);
      const stage = timedOut ? "timeout" : "response";
      logDiagnostic({ requestId, modelId, durationMs: Math.round(performance.now() - startedAt), providerStatus: response.status, category, errorStage: stage, ...(timedOut ? { errorType: failure.errorType, errorCode: failure.errorCode } : {}) });
      const message = timedOut ? "OpenRouter began responding but did not finish before the request timeout." : response.ok ? "OpenRouter returned a non-JSON response." : publicProviderMessage(category, response.status);
      throw new AIProviderError(message, "openrouter", category, timedOut ? 504 : response.ok ? 502 : apiStatus(category, response.status), response.status, failure.errorCode, stage);
    }
    if (!response.ok) {
      const category = categoryForStatus(response.status);
      const code = safeErrorCode(payload);
      logDiagnostic({ requestId, modelId, durationMs: Math.round(performance.now() - startedAt), providerStatus: response.status, category, errorStage: "http" });
      throw new AIProviderError(publicProviderMessage(category, response.status), "openrouter", category, apiStatus(category, response.status), response.status, code, "http");
    }
    const root = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    const choices = Array.isArray(root.choices) ? root.choices : [];
    const first = choices[0] && typeof choices[0] === "object" ? choices[0] as Record<string, unknown> : {};
    const message = first.message && typeof first.message === "object" ? first.message as Record<string, unknown> : {};
    const text = parseAssistantContent(message.content);
    const actualModel = typeof root.model === "string" && root.model ? root.model : modelId;
    if (modelId === DEFAULT_MODEL && actualModel !== DEFAULT_MODEL && !actualModel.endsWith(":free")) {
      logDiagnostic({ requestId, modelId: actualModel, durationMs: Math.round(performance.now() - startedAt), providerStatus: response.status, category: "invalid_response", errorStage: "response" });
      throw new AIProviderError("OpenRouter returned a model that cannot be confirmed as a free model; the response was rejected.", "openrouter", "invalid_response", 502, response.status, undefined, "response");
    }
    if (!text) {
      logDiagnostic({ requestId, modelId: actualModel, durationMs: Math.round(performance.now() - startedAt), providerStatus: response.status, category: "invalid_response", errorStage: "response" });
      throw new AIProviderError("OpenRouter returned no analysis content.", "openrouter", "invalid_response", 502, response.status, undefined, "response");
    }
    logDiagnostic({ requestId, modelId: actualModel, durationMs: Math.round(performance.now() - startedAt), providerStatus: response.status, category: "provider_success" });
    return { text, modelId: actualModel };
  } catch (error) {
    if (error instanceof AIProviderError) throw error;
    const failure = networkFailure(error);
    logDiagnostic({ requestId, modelId, durationMs: Math.round(performance.now() - startedAt), category: failure.category, errorStage: failure.stage, errorType: failure.errorType, errorCode: failure.errorCode });
    const message = failure.category === "network_dns" ? "Could not resolve openrouter.ai from the application server."
      : failure.category === "network_refused" ? "The connection to OpenRouter was refused by the network or remote endpoint."
        : failure.category === "network_tls" ? "The TLS certificate check for OpenRouter failed."
          : failure.category === "network_blocked" ? "The application runtime is not permitted to make outbound connections to OpenRouter."
            : failure.category === "timeout" ? "OpenRouter did not respond before its request timeout."
              : "The application could not complete its network request to OpenRouter.";
    const status = failure.category === "timeout" ? 504 : failure.category === "network_blocked" ? 503 : 502;
    throw new AIProviderError(message, "openrouter", failure.category, status, undefined, failure.errorCode, failure.stage);
  }
}
