import type { ZodType } from "zod";

export function parseJsonText(text: string): { success: true; data: unknown } | { success: false; reason: "empty" | "malformed_or_truncated" } {
  const normalized = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  if (!normalized) return { success: false, reason: "empty" };
  try { return { success: true, data: JSON.parse(normalized) as unknown }; }
  catch { return { success: false, reason: "malformed_or_truncated" }; }
}

export function validateJsonSchema<T>(value: unknown, schema: ZodType<T>) {
  return schema.safeParse(value);
}
