import * as Sentry from "@sentry/nextjs";
import { AIProviderError, type AIErrorCategory, type AIErrorStage } from "./types.ts";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const FREE_ROUTER = "openrouter/free";
// Measured locally with the production analysis payload (2026-11-27): these free models returned
// schema-valid JSON in ~7-11s (ernie) and ~18-33s (particle). The openrouter/free router can pick
// slow reasoning models (43-62s) or models that spend the whole token budget on reasoning.
const DEFAULT_MODELS = ["baidu/ernie-5.5-flash-preview:free", "particle-ai/particle-1:free"];
const MAX_MODELS = 3;
export const OPENROUTER_REQUEST_TIMEOUT_MS = 45_000;

type JsonSchema = Record<string, unknown>;
export type OpenRouterJsonResult = { text: string; modelId: string; finishReason?: string };

/** Ordered free-only model list from OPENROUTER_MODEL (comma-separated) or the measured default. */
export function getOpenRouterModels() {
  const configured = process.env.OPENROUTER_MODEL?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
  const models = configured.length ? configured : DEFAULT_MODELS;
  const allFree = models.every((model) => model === FREE_ROUTER || /^[a-z0-9_.-]+\/[a-z0-9_.-]+:free$/i.test(model));
  if (!allFree || models.length > MAX_MODELS) {
    throw new AIProviderError(`OpenRouter model must be openrouter/free or up to ${MAX_MODELS} explicit :free models.`, "openrouter", "configuration", 503, undefined, undefined, "configuration");
  }
  return models;
}

export function getOpenRouterModelId() {
  return getOpenRouterModels().join(",");
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

/**
 * OpenRouter's free tier has an account-wide daily cap (50 free-model requests/day without credits,
 * observed 2026-11-27) that is separate from a single model being rate-limited upstream. Only the
 * limit source and reset time are read; the provider message is never forwarded.
 */
function dailyLimitMessage(payload: unknown) {
  const error = payload && typeof payload === "object" && "error" in payload ? (payload as { error?: unknown }).error : undefined;
  const metadata = error && typeof error === "object" && "metadata" in error ? (error as { metadata?: unknown }).metadata : undefined;
  if (!metadata || typeof metadata !== "object") return undefined;
  const { limit_source: limitSource, headers } = metadata as { limit_source?: unknown; headers?: Record<string, unknown> };
  if (limitSource !== "openrouter_free_tier_daily") return undefined;
  const limit = Number(headers?.["X-RateLimit-Limit"]);
  const reset = Number(headers?.["X-RateLimit-Reset"]);
  const resetText = Number.isFinite(reset) && reset > 0 ? ` It resets at ${new Date(reset).toISOString().replace(".000Z", "Z")}.` : "";
  return `The OpenRouter free-tier daily request limit for this server${Number.isFinite(limit) && limit > 0 ? ` (${limit} requests per day)` : ""} has been reached.${resetText}`;
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
  finishReason?: string;
  provider?: string;
  completionTokens?: number;
  reasoningTokens?: number;
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
  timeoutMs = OPENROUTER_REQUEST_TIMEOUT_MS,
): Promise<OpenRouterJsonResult> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const models = getOpenRouterModels();
  const modelId = models.join(",");
  if (!apiKey) throw new AIProviderError("OpenRouter is not configured on the server.", "openrouter", "configuration", 503, undefined, undefined, "configuration");
  const startedAt = performance.now();
  Sentry.getIsolationScope().setTag("ai_provider", "openrouter");
  try {
    const response = await fetchImpl(OPENROUTER_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-OpenRouter-Title": "ClearNotice AI" },
      body: JSON.stringify({
        // A multi-model list uses OpenRouter's ordered fallback (e.g. when the first model is rate-limited).
        ...(models.length > 1 ? { models } : { model: models[0] }),
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userContent },
        ],
        temperature: 0.1,
        // Free models are reasoning models whose reasoning tokens count against this limit. With the
        // extended analysis schema, 6000 ended in finish_reason=length (ernie 1/3, particle 2/2);
        // 12000 completed in 17-23s for both (measured 2026-11-27). Free models carry no token cost.
        max_tokens: 12_000,
        provider: { require_parameters: true },
        response_format: { type: "json_schema", json_schema: { name: "clearnotice_analysis", strict: true, schema: closeSchema(schema) } },
      }),
      signal: AbortSignal.timeout(timeoutMs),
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
      // OpenRouter sends HTTP 200 headers immediately and keeps the connection open while a model reasons,
      // so a timeout here means the model was still generating, not that the request was never accepted.
      const message = timedOut ? `OpenRouter accepted the request, but the free model did not finish within ${Math.round(timeoutMs / 1000)} seconds. Free reasoning models can be slow or queued; please retry.` : response.ok ? "OpenRouter returned a non-JSON response." : publicProviderMessage(category, response.status);
      throw new AIProviderError(message, "openrouter", category, timedOut ? 504 : response.ok ? 502 : apiStatus(category, response.status), response.status, failure.errorCode, stage);
    }
    if (!response.ok) {
      const category = categoryForStatus(response.status);
      const code = safeErrorCode(payload);
      const dailyLimit = response.status === 429 ? dailyLimitMessage(payload) : undefined;
      logDiagnostic({ requestId, modelId, durationMs: Math.round(performance.now() - startedAt), providerStatus: response.status, category, errorStage: "http", ...(dailyLimit ? { errorCode: "FREE_TIER_DAILY_LIMIT" } : {}) });
      throw new AIProviderError(dailyLimit ?? publicProviderMessage(category, response.status), "openrouter", category, apiStatus(category, response.status), response.status, dailyLimit ? "FREE_TIER_DAILY_LIMIT" : code, "http");
    }
    const root = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    const choices = Array.isArray(root.choices) ? root.choices : [];
    const first = choices[0] && typeof choices[0] === "object" ? choices[0] as Record<string, unknown> : {};
    const message = first.message && typeof first.message === "object" ? first.message as Record<string, unknown> : {};
    const text = parseAssistantContent(message.content);
    const actualModel = typeof root.model === "string" && root.model ? root.model : models[0];
    const finishReason = typeof first.finish_reason === "string" ? first.finish_reason : undefined;
    const usage = root.usage && typeof root.usage === "object" ? root.usage as Record<string, unknown> : {};
    const usageDetails = usage.completion_tokens_details && typeof usage.completion_tokens_details === "object" ? usage.completion_tokens_details as Record<string, unknown> : {};
    const responseDetails = {
      finishReason,
      provider: typeof root.provider === "string" ? root.provider : undefined,
      completionTokens: typeof usage.completion_tokens === "number" ? usage.completion_tokens : undefined,
      reasoningTokens: typeof usageDetails.reasoning_tokens === "number" ? usageDetails.reasoning_tokens : undefined,
    };
    const confirmedFree = models.includes(actualModel) || (models.includes(FREE_ROUTER) && actualModel.endsWith(":free"));
    if (!confirmedFree) {
      logDiagnostic({ requestId, modelId: actualModel, durationMs: Math.round(performance.now() - startedAt), providerStatus: response.status, category: "invalid_response", errorStage: "response", ...responseDetails });
      throw new AIProviderError("OpenRouter returned a model that cannot be confirmed as a free model; the response was rejected.", "openrouter", "invalid_response", 502, response.status, undefined, "response");
    }
    if (!text) {
      logDiagnostic({ requestId, modelId: actualModel, durationMs: Math.round(performance.now() - startedAt), providerStatus: response.status, category: "invalid_response", errorStage: "response", ...responseDetails });
      const message = finishReason === "length"
        ? `The free model ${actualModel} used its whole output budget (mostly on reasoning) before writing the analysis. Please retry.`
        : "OpenRouter returned no analysis content.";
      throw new AIProviderError(message, "openrouter", "invalid_response", 502, response.status, undefined, "response");
    }
    logDiagnostic({ requestId, modelId: actualModel, durationMs: Math.round(performance.now() - startedAt), providerStatus: response.status, category: "provider_success", ...responseDetails });
    return { text, modelId: actualModel, finishReason };
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
