export type ApiErrorBody = { error?: string; category?: string; errorStage?: string };

export class ApiResponseError extends Error {
  readonly status: number;
  readonly requestId?: string;

  constructor(message: string, status: number, requestId?: string) {
    super(requestId ? `${message} (Reference: ${requestId})` : message);
    this.name = "ApiResponseError";
    this.status = status;
    this.requestId = requestId;
  }
}

function describeNonJson(status: number) {
  if (status === 502 || status === 503 || status === 504) {
    return `The server did not finish the request in time or was unavailable (HTTP ${status}). No analysis was produced. Please try again.`;
  }
  if (status === 404) return "The analysis service endpoint was not found (HTTP 404).";
  if (status === 413) return "The request is too large for the server (HTTP 413). Try a shorter document.";
  return `The server returned an unexpected non-JSON response (HTTP ${status}).`;
}

/**
 * Reads an API response as JSON only after checking Content-Type.
 * Platform error pages (HTML) and non-2xx responses are raised as errors,
 * never treated as successful results.
 */
export async function readJsonResponse<T extends object>(response: Response, failureMessage: string): Promise<T> {
  const requestId = response.headers.get("x-request-id") ?? response.headers.get("x-nf-request-id") ?? undefined;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new ApiResponseError(describeNonJson(response.status), response.status, requestId);
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiResponseError(`The server returned unreadable JSON (HTTP ${response.status}).`, response.status, requestId);
  }
  if (!payload || typeof payload !== "object") {
    throw new ApiResponseError(`The server returned an unexpected response (HTTP ${response.status}).`, response.status, requestId);
  }
  if (!response.ok) {
    const body = payload as ApiErrorBody;
    throw new ApiResponseError(body.error || `${failureMessage} (HTTP ${response.status})`, response.status, requestId);
  }
  return payload as T;
}
