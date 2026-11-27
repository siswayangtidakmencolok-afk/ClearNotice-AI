import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import * as Sentry from "@sentry/nextjs";
import { geminiAnalysisJsonSchema, geminiAnalysisSchema, type GeminiAnalysis } from "@/lib/analysis-schema";
import { parseJsonText, validateJsonSchema } from "./ai/response-validation";
import { EXTENDED_FIELD_RULES } from "./ai/analysis-instructions";

const DEFAULT_MODEL = "gemini-3.8-flash";
const REQUEST_TIMEOUT_MS = 35_000;
export function getGeminiModelId() {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}
type FailureCategory =
  | "configuration"
  | "invalid_request_or_config"
  | "authentication_or_permission"
  | "model_or_endpoint_not_found"
  | "usage_limit"
  | "provider_service_failure"
  | "network"
  | "timeout"
  | "invalid_json"
  | "json_validation";

export class GeminiServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly category: FailureCategory,
    public readonly providerStatus?: number,
    public readonly providerCode?: string,
    public readonly durationMs?: number,
  ) {
    super(message);
    this.name = "GeminiServiceError";
  }
}

function providerStatus(error: unknown) {
  if (!error || typeof error !== "object") return undefined;
  const candidate = "status" in error ? error.status : "statusCode" in error ? error.statusCode : undefined;
  return typeof candidate === "number" ? candidate : undefined;
}

function safeProviderCode(error: unknown): string | undefined {
  const allowedCode = (value: unknown) =>
    typeof value === "string" && /^[A-Z][A-Z0-9_]{1,63}$/.test(value) ? value : undefined;
  if (!error || typeof error !== "object") return undefined;

  if ("error" in error && error.error && typeof error.error === "object") {
    const payload = error.error as Record<string, unknown>;
    const nested = payload.error && typeof payload.error === "object"
      ? payload.error as Record<string, unknown>
      : payload;
    const code = allowedCode(nested.status) ?? allowedCode(nested.reason);
    if (code) return code;
  }

  // The SDK serializes the Google error body into ApiError.message. Only parse
  // its symbolic status; never log or return the raw provider body/message.
  if (error instanceof Error) {
    try {
      const parsed: unknown = JSON.parse(error.message);
      if (parsed && typeof parsed === "object" && "error" in parsed && parsed.error && typeof parsed.error === "object") {
        const payload = parsed.error as Record<string, unknown>;
        return allowedCode(payload.status) ?? allowedCode(payload.reason);
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function hasErrorName(error: unknown, names: string[], depth = 0): boolean {
  if (!error || typeof error !== "object" || depth > 3) return false;
  if ("name" in error && typeof error.name === "string" && names.includes(error.name)) return true;
  return "cause" in error ? hasErrorName(error.cause, names, depth + 1) : false;
}

function logGeminiDiagnostic(values: {
  requestId: string;
  modelId: string;
  durationMs?: number;
  httpStatus?: number;
  providerCode?: string;
  errorType?: string;
  category: string;
}) {
  console.info("[Gemini diagnostic]", JSON.stringify(values));
}

function providerCategory(status: number | undefined, error: unknown): FailureCategory {
  if (hasErrorName(error, ["TimeoutError", "AbortError", "APIConnectionTimeoutError", "APIUserAbortError"])) return "timeout";
  if (status === 400) return "invalid_request_or_config";
  if (status === 401 || status === 403) return "authentication_or_permission";
  if (status === 404) return "model_or_endpoint_not_found";
  if (status === 429) return "usage_limit";
  if (status === 504) return "timeout";
  if (status !== undefined && status >= 500) return "provider_service_failure";
  if (error instanceof TypeError || hasErrorName(error, ["APIConnectionError"])) return "network";
  return "provider_service_failure";
}

function publicProviderMessage(category: FailureCategory, status?: number) {
  switch (category) {
    case "invalid_request_or_config": return "Gemini rejected the request configuration (HTTP 400).";
    case "authentication_or_permission": return `Gemini authentication or permission failed (HTTP ${status}). Check server credentials and API access.`;
    case "model_or_endpoint_not_found": return `Gemini could not find the configured model or endpoint (HTTP ${status}).`;
    case "usage_limit": return "Gemini usage limit reached (HTTP 429). Please try again later.";
    case "provider_service_failure": return `Gemini service returned an error${status ? ` (HTTP ${status})` : ""}. Please try again later.`;
    case "network": return "Could not connect to the Gemini service. Check server network access.";
    case "timeout": return `Gemini did not respond within ${REQUEST_TIMEOUT_MS / 1000} seconds. Please try again later.`;
    default: return "Gemini could not complete the analysis. Please try again.";
  }
}

export async function analyzeWithGemini(source: string, requestId: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<GeminiAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    logGeminiDiagnostic({ requestId, modelId: process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL, category: "configuration" });
    throw new GeminiServiceError("Gemini is not configured on the server.", 503, "configuration");
  }

  const model = getGeminiModelId();
  const client = new GoogleGenAI({ apiKey });
  let response;
  const requestStartedAt = performance.now();

  try {
    response = await Sentry.startSpan(
      { name: "Gemini generateContent", op: "gen_ai.request" },
      () => client.models.generateContent({
        model,
        contents: source,
        config: {
          systemInstruction: [
            "Analyze the supplied public notice for a reader who needs to act on it.",
            "Return only the requested JSON structure. Do not invent facts, dates, eligibility rules, fees, or actions.",
            "For every sourceQuote, copy one complete sentence exactly from the supplied notice. If no sentence supports a finding, omit that finding or put the missing information in unknowns.",
            "For overview.organizer and overview.location, provide a concise detail and one exact complete source sentence when stated. If not stated, use detail 'Not stated in the source.' and an empty sourceQuote.",
            "Use 'Not stated in the source.' for an unavailable audience or other requested detail; never infer an organizer, participant group, fee, location, or action.",
            "Keep descriptions concise, distinguish explicit statements from interpretations, and use the notice's language for originalWording.",
            EXTENDED_FIELD_RULES,
          ].join(" "),
          responseMimeType: "application/json",
          responseJsonSchema: geminiAnalysisJsonSchema,
          temperature: 0.1,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          abortSignal: AbortSignal.timeout(timeoutMs),
          httpOptions: { timeout: timeoutMs, retryOptions: { attempts: 1 } },
        },
      }),
    );
  } catch (error) {
    const httpStatus = providerStatus(error);
    const category = providerCategory(httpStatus, error);
    const code = safeProviderCode(error);
    logGeminiDiagnostic({ requestId, modelId: model, durationMs: Math.round(performance.now() - requestStartedAt), httpStatus, providerCode: code, errorType: error instanceof Error ? error.name : undefined, category });
    const apiStatus = category === "invalid_request_or_config" ? 400
      : category === "usage_limit" ? 429
        : category === "authentication_or_permission" && httpStatus ? httpStatus
          : category === "provider_service_failure" && httpStatus === 503 ? 503
            : category === "timeout" ? 504
              : category === "network" ? 503
          : category === "configuration" ? 503
            : 502;
    throw new GeminiServiceError(publicProviderMessage(category, httpStatus), apiStatus, category, httpStatus, code, Math.round(performance.now() - requestStartedAt));
  }

  logGeminiDiagnostic({ requestId, modelId: model, durationMs: Math.round(performance.now() - requestStartedAt), httpStatus: 200, category: "provider_success" });
  const responseText = response.text;
  if (!responseText) {
    logGeminiDiagnostic({ requestId, modelId: model, durationMs: Math.round(performance.now() - requestStartedAt), httpStatus: 200, category: "invalid_json" });
    throw new GeminiServiceError("Gemini returned no analysis content. Please try again.", 502, "invalid_json", 200);
  }

  const validationStartedAt = performance.now();
  return Sentry.startSpan(
    { name: "AI response validation", op: "ai.validation" },
    () => {
      const parsed = parseJsonText(responseText);
      if (!parsed.success) {
        logGeminiDiagnostic({ requestId, modelId: model, durationMs: Math.round(performance.now() - validationStartedAt), httpStatus: 200, category: "invalid_json" });
        throw new GeminiServiceError("Gemini returned unreadable JSON. Please try again.", 502, "invalid_json", 200);
      }
      const validated = validateJsonSchema(parsed.data, geminiAnalysisSchema);
      if (!validated.success) {
        logGeminiDiagnostic({ requestId, modelId: model, durationMs: Math.round(performance.now() - validationStartedAt), httpStatus: 200, category: "json_validation" });
        throw new GeminiServiceError("Gemini returned an analysis that did not match the expected structure.", 502, "json_validation", 200);
      }
      logGeminiDiagnostic({ requestId, modelId: model, durationMs: Math.round(performance.now() - validationStartedAt), httpStatus: 200, category: "json_validation_success" });
      return validated.data;
    },
  );
}
