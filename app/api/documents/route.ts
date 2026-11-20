import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { withApiRequest } from "@/lib/sentry-api";
import { chunkDocument } from "@/lib/documents/chunk";
import { listDocuments, saveDocument, sessionIdFromRequest, withSessionCookie } from "@/lib/documents/store";

export function GET(request: Request) {
  return withApiRequest(request, "/api/documents", async () => {
    const sessionId = sessionIdFromRequest(request);
    try { return withSessionCookie(NextResponse.json({ documents: await listDocuments(sessionId) }), request, sessionId); }
    catch (error) {
      Sentry.getIsolationScope().setTag("failure_kind", "document_library_failure");
      Sentry.captureException(new Error("Document library request failed"));
      return withSessionCookie(NextResponse.json({ error: error instanceof Error && error.message.startsWith("Document library is not configured") ? error.message : "Document library is unavailable." }, { status: 503 }), request, sessionId);
    }
  });
}

export function POST(request: Request) {
  return withApiRequest(request, "/api/documents", async (requestId) => {
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Document details are required." }, { status: 400 });
    const input = body as { name?: unknown; fileType?: unknown; source?: unknown; paragraphPages?: unknown };
    if (typeof input.name !== "string" || input.name.length > 240 || typeof input.fileType !== "string" || !["PDF", "DOCX", "TXT", "TEXT"].includes(input.fileType.toUpperCase()) || typeof input.source !== "string" || !input.source.trim() || input.source.length > 120_000) {
      return NextResponse.json({ error: "Document details are invalid." }, { status: 400 });
    }
    const pages = Array.isArray(input.paragraphPages) && input.paragraphPages.every((item) => item === null || Number.isInteger(item) && item >= 1) ? input.paragraphPages as Array<number | null> : [];
    const sessionId = sessionIdFromRequest(request);
    const documentId = randomUUID();
    const chunks = chunkDocument({ documentId, documentName: input.name, sourceText: input.source, paragraphPages: pages });
    try {
      const id = await saveDocument(sessionId, input.name, input.fileType.toUpperCase(), input.source, chunks);
      console.info("[Document library diagnostic]", JSON.stringify({ requestId, durationMs: 0, outcome: "saved", chunkCount: chunks.length }));
      return withSessionCookie(NextResponse.json({ documentId: id, chunkCount: chunks.length }, { status: 201 }), request, sessionId);
    } catch {
      console.info("[Document library diagnostic]", JSON.stringify({ requestId, outcome: "save_failed" }));
      Sentry.getIsolationScope().setTag("failure_kind", "document_save_failure");
      Sentry.captureException(new Error("Document save failed"));
      return withSessionCookie(NextResponse.json({ error: "Document could not be saved. Confirm DATABASE_URL and apply the document library migration." }, { status: 503 }), request, sessionId);
    }
  });
}
