import type { DocumentChunk } from "./types";

export type EvidenceCitation = { chunkId: string; quote: string };

export function validateCitations<T extends { citations: EvidenceCitation[] }>(value: T, chunks: DocumentChunk[]): T {
  const byId = new Map(chunks.map((chunk) => [chunk.chunkId, chunk]));
  const citations = value.citations.filter((citation) => {
    const chunk = byId.get(citation.chunkId);
    return Boolean(chunk && citation.quote.trim().length >= 8 && chunk.text.includes(citation.quote) && chunk.sourceText.includes(citation.quote));
  });
  return { ...value, citations };
}
