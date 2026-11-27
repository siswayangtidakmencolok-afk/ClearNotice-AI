import { geminiAnalysisJsonSchema, geminiAnalysisSchema, type GeminiAnalysis } from "@/lib/analysis-schema";
import { AIProviderError } from "./types";
import { generateOpenRouterJson } from "./openrouter-provider";
import { parseJsonText, validateJsonSchema } from "./response-validation";
import { EXTENDED_FIELD_RULES } from "./analysis-instructions";

const INSTRUCTIONS = [
  "Analyze the supplied public notice for a reader who needs to act on it.",
  "Return only the requested JSON structure. Do not invent facts, dates, eligibility rules, fees, location, organizer, or actions.",
  "For every sourceQuote, copy one complete sentence exactly from the supplied notice.",
  "For overview.organizer and overview.location, use a concise detail and an exact complete source sentence when stated. If missing, use detail 'Not stated in the source.' and an empty sourceQuote.",
  "Use 'Not stated in the source.' for unavailable details. Never infer an organizer, audience, fee, location, or action.",
  EXTENDED_FIELD_RULES,
].join(" ");

export async function analyzeWithOpenRouter(source: string, requestId: string, timeoutMs?: number): Promise<{ analysis: GeminiAnalysis; modelId: string }> {
  const generated = await generateOpenRouterJson(INSTRUCTIONS, source, geminiAnalysisJsonSchema, requestId, fetch, timeoutMs);
  const parsed = parseJsonText(generated.text);
  if (!parsed.success) {
    console.info("[AI response validation]", JSON.stringify({ requestId, provider: "openrouter", modelId: generated.modelId, finishReason: generated.finishReason, outputChars: generated.text.length, outcome: parsed.reason }));
    // Truncated output is rejected, never repaired: a partial object would present missing data as a result.
    const message = parsed.reason === "empty" ? "OpenRouter returned an empty analysis."
      : generated.finishReason === "length"
        ? `The free model ${generated.modelId} hit its output limit before finishing the JSON, so the incomplete result was rejected. Please retry.`
        : `The free model ${generated.modelId} returned malformed or incomplete JSON, so the result was rejected. Please retry.`;
    throw new AIProviderError(message, "openrouter", "invalid_json", 502, 200, undefined, "validation");
  }
  const validationStartedAt = performance.now();
  const validated = validateJsonSchema(parsed.data, geminiAnalysisSchema);
  if (!validated.success) {
    console.info("[AI response validation]", JSON.stringify({ requestId, provider: "openrouter", modelId: generated.modelId, durationMs: Math.round(performance.now() - validationStartedAt), outcome: "schema_invalid" }));
    throw new AIProviderError("OpenRouter's analysis did not match the expected schema. Retry with a shorter or clearer announcement.", "openrouter", "json_validation", 502, 200, undefined, "validation");
  }
  console.info("[AI response validation]", JSON.stringify({ requestId, provider: "openrouter", modelId: generated.modelId, durationMs: Math.round(performance.now() - validationStartedAt), outcome: "schema_valid" }));
  return { analysis: validated.data, modelId: generated.modelId };
}
