import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { withApiRequest } from "@/lib/sentry-api";
import { rerankChunks } from "@/lib/documents/rerank";
import { loadDocumentChunks, sessionIdFromRequest, withSessionCookie } from "@/lib/documents/store";
import { compareFromDocuments } from "@/lib/ai/document-intelligence";

export const maxDuration = 60;
export function POST(request: Request) {
  return withApiRequest(request, "/api/documents/compare", async (requestId) => {
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Choose at least two documents." }, { status: 400 });
    const { question, documentIds, consentToOpenRouter } = body as { question?: unknown; documentIds?: unknown; consentToOpenRouter?: unknown };
    if (typeof question !== "string" || !question.trim() || question.length > 1_000 || !Array.isArray(documentIds) || documentIds.length < 2 || documentIds.length > 10 || documentIds.some((id) => typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id))) return NextResponse.json({ error: "Provide a comparison question and select two to ten saved documents." }, { status: 400 });
    if (consentToOpenRouter !== undefined && typeof consentToOpenRouter !== "boolean") return NextResponse.json({ error: "OpenRouter consent must be a boolean value." }, { status: 400 });
    if (consentToOpenRouter !== true) return NextResponse.json({ error: "Consent is required before sending document passages to OpenRouter.", provider: "openrouter", category: "consent_required" }, { status: 403 });
    const sessionId = sessionIdFromRequest(request);
    try {
      const chunks = await loadDocumentChunks(sessionId, documentIds as string[]);
      if (new Set(chunks.map((chunk) => chunk.documentId)).size < 2) return withSessionCookie(NextResponse.json({ error: "Two or more selected documents were not found in this session." }, { status: 404 }), request, sessionId);
      const ranked = await rerankChunks(question.trim(), chunks, requestId);
      const result = await compareFromDocuments(question.trim(), ranked.items.slice(0, 60), requestId, true);
      return withSessionCookie(NextResponse.json({ ...result, evidenceStatus: "retrieved-and-quoted", reranking: ranked.status, rerankModel: ranked.modelId }), request, sessionId);
    } catch (error) {
      Sentry.getIsolationScope().setTag("failure_kind", "document_comparison_failure");
      if (error instanceof Error && "category" in error) return withSessionCookie(NextResponse.json({ error: error.message, category: error.category, provider: "provider" in error ? error.provider : undefined, providerStatus: "providerStatus" in error ? error.providerStatus : undefined, providerCode: "providerCode" in error ? error.providerCode : undefined, errorStage: "errorStage" in error ? error.errorStage : undefined }, { status: "status" in error && typeof error.status === "number" ? error.status : 502 }), request, sessionId);
      Sentry.captureException(new Error("Document comparison failed"));
      return withSessionCookie(NextResponse.json({ error: error instanceof Error && error.message.startsWith("Document library is not configured") ? error.message : "The selected documents could not be compared." }, { status: 503 }), request, sessionId);
    }
  });
}
