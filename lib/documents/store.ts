import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import type { DocumentChunk } from "./types";

export type StoredDocument = { id: string; name: string; fileType: string; createdAt: string; chunkCount: number };

function database() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("Document library is not configured. Set DATABASE_URL and apply the migration in db/migrations.");
  return neon(url);
}

export async function saveDocument(sessionId: string, name: string, fileType: string, sourceText: string, chunks: DocumentChunk[]) {
  const sql = database();
  const id = chunks[0]?.documentId ?? randomUUID();
  await sql`INSERT INTO clearnotice_documents (id, session_id, name, file_type, source_text) VALUES (${id}, ${sessionId}, ${name}, ${fileType}, ${sourceText})`;
  for (let start = 0; start < chunks.length; start += 100) {
    const batch = chunks.slice(start, start + 100);
    await sql`INSERT INTO clearnotice_document_chunks (document_id, session_id, chunk_id, chunk_text, page_number)
      SELECT ${id}::uuid, ${sessionId}::uuid, item.chunk_id, item.chunk_text, item.page_number
      FROM jsonb_to_recordset(${JSON.stringify(batch.map((item) => ({ chunk_id: item.chunkId, chunk_text: item.text, page_number: item.pageNumber })))}::jsonb)
      AS item(chunk_id text, chunk_text text, page_number integer)`;
  }
  return id;
}

export async function listDocuments(sessionId: string): Promise<StoredDocument[]> {
  const sql = database();
  const rows = await sql`SELECT d.id::text, d.name, d.file_type, d.created_at::text,
    (SELECT count(*)::int FROM clearnotice_document_chunks c WHERE c.document_id = d.id) AS chunk_count
    FROM clearnotice_documents d WHERE d.session_id = ${sessionId}::uuid ORDER BY d.created_at DESC LIMIT 100`;
  return rows.map((row) => ({ id: String(row.id), name: String(row.name), fileType: String(row.file_type), createdAt: String(row.created_at), chunkCount: Number(row.chunk_count) }));
}

export async function retrieveChunks(sessionId: string, question: string, documentIds?: string[], limit = 40): Promise<DocumentChunk[]> {
  const sql = database();
  const ids = documentIds?.length ? documentIds : null;
  const rows = await sql`SELECT c.document_id::text, d.name, c.chunk_id, c.chunk_text, c.page_number,
    ts_rank(c.search_vector, websearch_to_tsquery('simple', ${question}))::float AS retrieval_score,
    d.source_text
    FROM clearnotice_document_chunks c JOIN clearnotice_documents d ON d.id = c.document_id
    WHERE c.session_id = ${sessionId}::uuid AND (${ids}::uuid[] IS NULL OR c.document_id = ANY(${ids}::uuid[]))
      AND c.search_vector @@ websearch_to_tsquery('simple', ${question})
    ORDER BY retrieval_score DESC LIMIT ${Math.max(1, Math.min(limit, 100))}`;
  return rows.map((row) => ({ documentId: String(row.document_id), documentName: String(row.name), chunkId: String(row.chunk_id), text: String(row.chunk_text), pageNumber: row.page_number == null ? null : Number(row.page_number), sourceText: String(row.source_text), retrievalScore: Number(row.retrieval_score) }));
}

export async function loadDocumentChunks(sessionId: string, documentIds: string[]): Promise<DocumentChunk[]> {
  const sql = database();
  const rows = await sql`SELECT c.document_id::text, d.name, c.chunk_id, c.chunk_text, c.page_number,
    d.source_text FROM clearnotice_document_chunks c JOIN clearnotice_documents d ON d.id = c.document_id
    WHERE c.session_id = ${sessionId}::uuid AND c.document_id = ANY(${documentIds}::uuid[])
    ORDER BY d.created_at, c.chunk_id LIMIT 200`;
  return rows.map((row) => ({ documentId: String(row.document_id), documentName: String(row.name), chunkId: String(row.chunk_id), text: String(row.chunk_text), pageNumber: row.page_number == null ? null : Number(row.page_number), sourceText: String(row.source_text), retrievalScore: 0 }));
}

export function sessionIdFromRequest(request: Request) {
  const match = request.headers.get("cookie")?.match(/(?:^|;\s*)clearnotice_session=([0-9a-f-]{36})(?:;|$)/i);
  return match?.[1] ?? randomUUID();
}

export function withSessionCookie(response: NextResponse, request: Request, sessionId: string) {
  if (request.headers.get("cookie")?.includes("clearnotice_session=")) return response;
  response.headers.append("Set-Cookie", `clearnotice_session=${sessionId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  return response;
}
