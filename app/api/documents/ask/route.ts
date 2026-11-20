import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { withApiRequest } from "@/lib/sentry-api";
import { rerankChunks } from "@/lib/documents/rerank";
import { retrieveChunks, sessionIdFromRequest, withSessionCookie } from "@/lib/documents/store";
import { answerFromDocuments } from "@/lib/ai/document-intelligence";

export const maxDuration = 60;
export function POST(request: Request) {
  return withApiRequest(request, "/api/documents/ask", async (requestId) => {
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    if (!body || typeof body !== "object" || typeof (body as { question?: unknown }).question !== "string") return NextResponse.json({ error: "A question is required." }, { status: 400 });
    const { question, documentIds, consentToOpenRouter } = body as { question: string; documentIds?: unknown; consentToOpenRouter?: unknown };
    if (!question.trim() || question.length > 1_000 || documentIds !== undefined && (!Array.isArray(documentIds) || documentIds.length > 20 || documentIds.some((id) => typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)))) return NextResponse.json({ error: "Question or document selection is invalid." }, { status: 400 });
    if (consentToOpenRouter !== undefined && typeof consentToOpenRouter !== "boolean") return NextResponse.json({ error: "OpenRouter consent must be a boolean value." }, { status: 400 });
    if (consentToOpenRouter !== true) return NextResponse.json({ error: "Consent is required before sending document passages to OpenRouter.", provider: "openrouter", category: "consent_required" }, { status: 403 });
    const sessionId = sessionIdFromRequest(request);
    try {
      const retrieved = await retrieveChunks(sessionId, question.trim(), documentIds as string[] | undefined);
      if (!retrieved.length) return withSessionCookie(NextResponse.json({ error: "No matching passages were found in this session's saved documents." }, { status: 404 }), request, sessionId);
      const ranked = await rerankChunks(question.trim(), retrieved, requestId);
      const result = await answerFromDocuments(question.trim(), ranked.items.slice(0, 24), requestId, true);
      return withSessionCookie(NextResponse.json({ ...result, evidenceStatus: "retrieved-and-quoted", reranking: ranked.status, rerankModel: ranked.modelId, citations: result.citations.map((citation) => {
        const chunk = retrieved.find((item) => item.chunkId === citation.chunkId);
        return { ...citation, documentId: chunk?.documentId, documentName: chunk?.documentName, pageNumber: chunk?.pageNumber };
      }) }), request, sessionId);
    } catch (error) {
      Sentry.getIsolationScope().setTag("failure_kind", "document_question_failure");
      if (error instanceof Error && "category" in error) return withSessionCookie(NextResponse.json({ error: error.message, category: error.category, provider: "provider" in error ? error.provider : undefined, providerStatus: "providerStatus" in error ? error.providerStatus : undefined, providerCode: "providerCode" in error ? error.providerCode : undefined, errorStage: "errorStage" in error ? error.errorStage : undefined }, { status: "status" in error && typeof error.status === "number" ? error.status : 502 }), request, sessionId);
      Sentry.captureException(new Error("Document question failed"));
      return withSessionCookie(NextResponse.json({ error: error instanceof Error && error.message.startsWith("Document library is not configured") ? error.message : "The document question could not be completed." }, { status: 503 }), request, sessionId);
    }
  });
}
