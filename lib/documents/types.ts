export type DocumentChunk = {
  documentId: string;
  documentName: string;
  chunkId: string;
  text: string;
  pageNumber: number | null;
  sourceText: string;
  retrievalScore: number;
  relevanceScore?: number | null;
};

export type RerankResult = {
  items: DocumentChunk[];
  status: "reranked" | "fallback";
  modelId?: string;
  reason?: "not_configured" | "request_failed";
};
