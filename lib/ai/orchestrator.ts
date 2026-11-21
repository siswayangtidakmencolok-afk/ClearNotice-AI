import * as Sentry from "@sentry/nextjs";
import { analyzeWithGemini, getGeminiModelId, GeminiServiceError } from "@/lib/gemini";
import { analyzeWithOpenRouter } from "./analyze-with-openrouter";
import { AIProviderError, type AIAnalysisResult } from "./types";

/**
 * Multi-Provider AI Orchestrator
 * - Primary: Google Gemini API (gemini-3.8-flash)
 * - Secondary: OpenRouter API (controlled fallback on recoverable Gemini errors)
 */
export async function analyzeWithSelectedProvider(
  source: string,
  requestId: string,
): Promise<AIAnalysisResult> {
  const geminiModel = getGeminiModelId();
  const startTime = performance.now();
  let geminiError: unknown = null;

  // 1. Attempt Primary Provider: Google Gemini
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY?.trim());
  if (hasGeminiKey) {
    try {
      const analysis = await analyzeWithGemini(source, requestId);
      const durationMs = Math.round(performance.now() - startTime);
      Sentry.getIsolationScope().setTag("ai_provider", "gemini");
      Sentry.getIsolationScope().setTag("ai_model", geminiModel);
      return {
        analysis,
        provider: "gemini",
        modelId: geminiModel,
        durationMs,
      };
    } catch (err) {
      geminiError = err;
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[AI Orchestrator] Gemini analysis failed for request ${requestId}: ${errorMsg}. Evaluating fallback to OpenRouter.`);
      Sentry.getIsolationScope().setTag("gemini_failed", "true");
    }
  } else {
    console.info(`[AI Orchestrator] Gemini API key not configured. Checking OpenRouter fallback.`);
  }

  // 2. Evaluate Fallback Eligibility: OpenRouter
  const hasOpenRouterKey = Boolean(process.env.OPENROUTER_API_KEY?.trim());
  if (hasOpenRouterKey) {
    try {
      const fallbackResult = await analyzeWithOpenRouter(source, requestId);
      const durationMs = Math.round(performance.now() - startTime);
      const fallbackReason = geminiError instanceof GeminiServiceError
        ? `Gemini ${geminiError.category} (${geminiError.status}): ${geminiError.message}`
        : geminiError instanceof Error
          ? geminiError.message
          : !hasGeminiKey
            ? "Gemini API key not configured on server"
            : "Primary provider unavailable";

      Sentry.getIsolationScope().setTag("ai_provider", "openrouter_fallback");
      Sentry.getIsolationScope().setTag("ai_model", fallbackResult.modelId);

      return {
        analysis: fallbackResult.analysis,
        provider: "openrouter",
        modelId: fallbackResult.modelId,
        fallbackFrom: "gemini",
        fallbackReason,
        durationMs,
      };
    } catch (orError) {
      console.error(`[AI Orchestrator] OpenRouter fallback also failed for request ${requestId}:`, orError);
      if (orError instanceof AIProviderError) {
        throw orError;
      }
      throw new AIProviderError(
        "Both primary (Gemini) and secondary (OpenRouter) AI providers are currently unavailable. Please try again later.",
        "openrouter",
        "provider_service_failure",
        503,
      );
    }
  }

  // If Gemini failed and OpenRouter is not configured
  if (geminiError instanceof GeminiServiceError) {
    throw new AIProviderError(
      geminiError.message,
      "gemini",
      geminiError.category,
      geminiError.status,
      geminiError.providerStatus,
      geminiError.providerCode,
    );
  }

  throw new AIProviderError(
    "No AI providers are configured or available on the server. Please check environment variables.",
    "gemini",
    "configuration",
    503,
  );
}
