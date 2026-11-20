import { geminiAnalysisJsonSchema, geminiAnalysisSchema, type GeminiAnalysis } from "@/lib/analysis-schema";
import { AIProviderError } from "./types";
import { generateOpenRouterJson } from "./openrouter-provider";
import { parseJsonText, validateJsonSchema } from "./response-validation";

const INSTRUCTIONS = [
  "Analyze the supplied public notice for a reader who needs to act on it.",
  "Return only the requested JSON structure. Do not invent facts, dates, eligibility rules, fees, location, organizer, or actions.",
  "For every sourceQuote, copy one complete sentence exactly from the supplied notice.",
  "For overview.organizer and overview.location, use a concise detail and an exact complete source sentence when stated. If missing, use detail 'Not stated in the source.' and an empty sourceQuote.",
  "Use 'Not stated in the source.' for unavailable details. Never infer an organizer, audience, fee, location, or action.",
].join(" ");

export async function analyzeWithOpenRouter(source: string, requestId: string): Promise<{ analysis: GeminiAnalysis; modelId: string }> {
  const generated = await generateOpenRouterJson(INSTRUCTIONS, source, geminiAnalysisJsonSchema, requestId);
  const parsed = parseJsonText(generated.text);
  if (!parsed.success) {
    console.info("[AI response validation]", JSON.stringify({ requestId, provider: "openrouter", modelId: generated.modelId, outcome: parsed.reason }));
    throw new AIProviderError(parsed.reason === "empty" ? "OpenRouter returned an empty analysis." : "OpenRouter returned malformed or truncated JSON. Retry the analysis.", "openrouter", "invalid_json", 502, 200, undefined, "validation");
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
