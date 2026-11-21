import type { DocumentChunk } from "./types";

const MAX_CHUNK_LENGTH = 1_200;

export function chunkDocument(input: {
  documentId: string;
  documentName: string;
  sourceText: string;
  paragraphPages?: Array<number | null>;
}): DocumentChunk[] {
  const paragraphs = input.sourceText.split(/\n\s*\n/).map((text) => text.trim()).filter(Boolean);
  const chunks: DocumentChunk[] = [];
  paragraphs.forEach((paragraph, paragraphIndex) => {
    const pageNumber = input.paragraphPages?.[paragraphIndex] ?? null;
    const sentences = paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [paragraph];
    let current = "";
    const push = (text: string) => {
      const normalized = text.trim();
      if (!normalized) return;
      const chunkId = `${input.documentId}:${chunks.length + 1}`;
      chunks.push({
        documentId: input.documentId,
        documentName: input.documentName,
        chunkId,
        text: normalized,
        pageNumber,
        sourceText: input.sourceText,
        retrievalScore: 0,
      });
    };
    for (const sentence of sentences) {
      const part = sentence.trim();
      if (!part) continue;
      if (part.length > MAX_CHUNK_LENGTH) {
        push(current);
        current = "";
        for (let start = 0; start < part.length; start += MAX_CHUNK_LENGTH) push(part.slice(start, start + MAX_CHUNK_LENGTH));
      } else if (current && current.length + part.length + 1 > MAX_CHUNK_LENGTH) {
        push(current);
        current = part;
      } else {
        current = current ? `${current} ${part}` : part;
      }
    }
    push(current);
  });
  return chunks;
}
