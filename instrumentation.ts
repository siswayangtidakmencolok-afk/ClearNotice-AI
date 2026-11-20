import * as Sentry from "@sentry/nextjs";
import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  Sentry.withIsolationScope((scope) => {
    scope.setTag("request_id", globalThis.crypto.randomUUID());
    scope.setTag("request_method", request.method);
    scope.setTag("route", context.routePath);
    Sentry.captureRequestError(error, request, context);
  });
};
