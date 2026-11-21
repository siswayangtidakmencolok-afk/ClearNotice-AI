import * as Sentry from "@sentry/nextjs";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export async function withApiRequest(
  request: Request,
  route: "/api/analyze" | "/api/extract" | "/api/documents" | "/api/documents/ask" | "/api/documents/compare",
  handler: (requestId: string) => Promise<NextResponse>,
): Promise<NextResponse> {
  const requestId = randomUUID();
  return Sentry.withIsolationScope(async (scope) => {
    scope.setTag("request_id", requestId);
    scope.setTag("api_route", route);
    try {
      return await Sentry.startSpan({ name: `POST ${route}`, op: "http.server" }, () => handler(requestId))
        .then((response) => {
          response.headers.set("x-request-id", requestId);
          return response;
        });
    } catch {
      Sentry.captureException(new Error("Unexpected API handler failure"));
      return NextResponse.json(
        { error: "The request could not be completed. Please try again.", requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }
  });
}

export function withSafeSpan<T>(name: string, callback: () => T): T {
  return Sentry.startSpan({ name, op: "app.operation" }, callback);
}
