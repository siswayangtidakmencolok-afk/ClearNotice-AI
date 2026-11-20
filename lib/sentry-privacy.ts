import type { Event } from "@sentry/nextjs";
import type { StreamedSpanJSON } from "@sentry/core";

/** Remove request and free-form values that may contain document text or credentials. */
export function scrubSentryEvent<T extends Event>(event: T): T {
  event.request = undefined;
  event.user = undefined;
  event.extra = undefined;
  event.breadcrumbs = undefined;
  event.logentry = undefined;
  event.tags = event.tags
    ? Object.fromEntries(Object.entries(event.tags).filter(([key]) => SAFE_TAGS.has(key)))
    : undefined;
  event.contexts = event.contexts?.trace ? { trace: event.contexts.trace } : undefined;
  if (event.transaction && !SAFE_SPAN_NAMES.has(event.transaction) && !/^\/(api\/analyze|api\/extract|api\/sentry-example-api)$/.test(event.transaction)) {
    event.transaction = "application event";
  }

  if (event.message) event.message = "Application event";
  if (event.exception?.values) {
    event.exception.values = event.exception.values.map((value) => ({
      type: "Error",
      value: "Unexpected application error",
      stacktrace: value.stacktrace,
    }));
  }
  for (const span of event.spans ?? []) span.data = {};
  return event;
}

const SAFE_SPAN_ATTRIBUTES = new Set([
  "sentry.origin", "sentry.op", "sentry.segment.name.source", "sentry.sample_rate", "sentry.kind",
]);
const SAFE_SPAN_NAMES = new Set([
  "POST /api/analyze", "POST /api/extract", "Gemini request", "Gemini generateContent",
  "AI response validation", "Evidence mapping",
]);
const SAFE_TAGS = new Set(["request_id", "api_route", "request_method", "route", "failure_kind"]);

export function scrubSentrySpan(span: StreamedSpanJSON): StreamedSpanJSON {
  span.name = SAFE_SPAN_NAMES.has(span.name) ? span.name : "operation";
  span.attributes = Object.fromEntries(
    Object.entries(span.attributes).filter(([key]) => SAFE_SPAN_ATTRIBUTES.has(key)),
  );
  span.links = undefined;
  return span;
}
