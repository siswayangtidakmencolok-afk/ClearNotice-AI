import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { mapGeminiAnalysis } from "@/lib/map-gemini-analysis";
import { withApiRequest, withSafeSpan } from "@/lib/sentry-api";
import { analyzeWithSelectedProvider } from "@/lib/ai/orchestrator";
import { AIProviderError } from "@/lib/ai/types";

export const maxDuration = 60;
const MAX_TEXT_CHARS = 120_000;

async function analyzeRequest(request: Request, requestId: string) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Provide announcement text to analyze." }, { status: 400 });
  }

  const { source, paragraphPages, consentToOpenRouter, consentToAI } = payload as {
    source?: unknown;
    paragraphPages?: unknown;
    consentToOpenRouter?: unknown;
    consentToAI?: unknown;
  };
  if (typeof source !== "string" || !source.trim()) {
    return NextResponse.json({ error: "Paste an announcement or upload a readable document first." }, { status: 400 });
  }
  if (source.length > MAX_TEXT_CHARS) {
    return NextResponse.json({ error: `This announcement exceeds the ${MAX_TEXT_CHARS.toLocaleString()} character limit.` }, { status: 413 });
  }
  
  const userConsent = consentToAI !== undefined ? consentToAI : consentToOpenRouter;
  if (userConsent !== undefined && typeof userConsent !== "boolean") {
    return NextResponse.json({ error: "AI processing consent must be a boolean value." }, { status: 400 });
  }
  if (userConsent !== true) {
    return NextResponse.json({
      error: "Consent is required before sending this announcement to server-side AI processing.",
      provider: "gemini",
      category: "consent_required",
    }, { status: 403 });
  }

  if (paragraphPages !== undefined && (!Array.isArray(paragraphPages) || paragraphPages.length > 5000 || paragraphPages.some((page) => page !== null && (!Number.isInteger(page) || page < 1)))) {
    return NextResponse.json({ error: "Document page references are invalid. Upload the document again." }, { status: 400 });
  }

  try {
    const providerResult = await withSafeSpan("AI provider request", () => analyzeWithSelectedProvider(source.trim(), requestId));
    return NextResponse.json({
      provider: providerResult.provider,
      modelId: providerResult.modelId,
      fallbackFrom: providerResult.fallbackFrom,
      fallbackReason: providerResult.fallbackReason,
      analysis: withSafeSpan("Evidence mapping", () => mapGeminiAnalysis(
        source.trim(),
        (paragraphPages as Array<number | null> | undefined) ?? [],
        providerResult.analysis,
        providerResult.provider,
        providerResult.modelId,
        providerResult.fallbackFrom,
        providerResult.fallbackReason,
        providerResult.durationMs,
      )),
    });
  } catch (error) {
    if (error instanceof AIProviderError) {
      return NextResponse.json({
        error: error.message,
        provider: error.provider,
        category: error.category,
        providerStatus: error.providerStatus,
        providerCode: error.providerCode,
        errorStage: error.errorStage,
      }, { status: error.status });
    }
    // Do not forward the SDK exception: provider errors can contain request data.
    if (process.env.NODE_ENV === "development" && error instanceof Error) {
      console.error("[Analysis unexpected exception stack]", JSON.stringify({
        requestId,
        errorType: error.name,
        stackFrames: error.stack?.split("\n").slice(1).map((frame) => frame.trim()) ?? [],
      }));
    }
    Sentry.getIsolationScope().setTag("failure_kind", "unexpected_analysis_error");
    Sentry.captureException(new Error("Unexpected analysis failure"));
    return NextResponse.json({ error: "Analysis failed unexpectedly. Please try again." }, { status: 500 });
  }
}

export function POST(request: Request) {
  return withApiRequest(request, "/api/analyze", (requestId) => analyzeRequest(request, requestId));
}
