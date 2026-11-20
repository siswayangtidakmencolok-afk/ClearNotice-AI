import { CohereClientV2 } from "cohere-ai";
import type { DocumentChunk, RerankResult } from "./types";

const DEFAULT_MODEL = "rerank-v5.0-fast";
const MAX_CANDIDATES = 1_000;

export function getCohereRerankModelId() {
  return process.env.COHERE_RERANK_MODEL?.trim() || DEFAULT_MODEL;
}

export function minimumRelevanceScore() {
  const parsed = Number(process.env.COHERE_MIN_RELEVANCE_SCORE ?? "0");
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : 0;
}

function logRerankDiagnostic(values: { requestId: string; modelId: string; durationMs: number; status: string; providerStatus?: number; errorType?: string }) {
  console.info("[Cohere rerank diagnostic]", JSON.stringify(values));
}

export async function rerankChunks(
  query: string,
  chunks: DocumentChunk[],
  requestId: string,
): Promise<RerankResult> {
  if (!chunks.length) return { items: [], status: "reranked", modelId: getCohereRerankModelId() };
  if (!process.env.COHERE_API_KEY?.trim()) {
    return { items: chunks.map((chunk) => ({ ...chunk, relevanceScore: null })), status: "fallback", reason: "not_configured" };
  }

  const modelId = getCohereRerankModelId();
  const candidates = chunks.slice(0, MAX_CANDIDATES);
  const client = new CohereClientV2({ token: process.env.COHERE_API_KEY, timeoutInSeconds: 15, maxRetries: 0 });
  const startedAt = performance.now();
  try {
    const response = await client.rerank({
      model: modelId,
      query,
      documents: candidates.map((chunk) => chunk.text),
      topN: candidates.length,
    });
    const ordered = response.results
      .filter((result) => result.index >= 0 && result.index < candidates.length)
      .map((result) => ({ ...candidates[result.index], relevanceScore: result.relevanceScore }))
      .filter((chunk) => (chunk.relevanceScore ?? 0) >= minimumRelevanceScore());
    logRerankDiagnostic({ requestId, modelId, durationMs: Math.round(performance.now() - startedAt), status: "success" });
    return { items: ordered, status: "reranked", modelId };
  } catch (error) {
    const providerStatus = error && typeof error === "object" && "statusCode" in error && typeof error.statusCode === "number"
      ? error.statusCode
      : error && typeof error === "object" && "status" in error && typeof error.status === "number" ? error.status : undefined;
    logRerankDiagnostic({ requestId, modelId, durationMs: Math.round(performance.now() - startedAt), status: "fallback", providerStatus, errorType: error instanceof Error ? error.name : "UnknownError" });
    return {
      items: candidates.map((chunk) => ({ ...chunk, relevanceScore: null })),
      status: "fallback",
      reason: "request_failed",
      modelId,
    };
  }
}
