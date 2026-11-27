import { z } from "zod";

const text = z.string().trim().max(4000);
const quotedFinding = z.object({
  label: text,
  detail: text,
  sourceQuote: text,
});

export const geminiAnalysisSchema = z.object({
  overview: z.object({
    subject: text,
    category: text,
    summary: text,
    audience: text,
    organizer: quotedFinding,
    location: quotedFinding,
  }),
  announcementType: quotedFinding,
  keyFacts: z.array(quotedFinding).max(40),
  importantDates: z.array(z.object({
    label: text,
    detail: text,
    originalWording: text,
    sourceQuote: text,
    status: z.enum(["stated", "ambiguous"]),
    precision: z.enum(["exact", "approximate"]),
  })).max(30),
  benefits: z.array(quotedFinding).max(30),
  contacts: z.array(z.object({
    type: z.enum(["registration_url", "website", "email", "phone", "other"]),
    label: text,
    value: text,
    sourceQuote: text,
  })).max(20),
  eligibility: z.array(quotedFinding).max(40),
  requirements: z.array(quotedFinding).max(40),
  costsAndFees: z.array(quotedFinding).max(30),
  actionItems: z.array(quotedFinding).max(40),
  warnings: z.array(quotedFinding).max(40),
  unknowns: z.array(z.object({ label: text, detail: text })).max(40),
  nextSteps: z.array(z.object({ detail: text, sourceQuote: text })).max(30),
  translation: z.object({
    sourceLanguage: text,
    needed: z.boolean(),
    summary: text,
    keyPoints: z.array(text).max(12),
  }),
});

export type GeminiAnalysis = z.infer<typeof geminiAnalysisSchema>;

export const geminiAnalysisJsonSchema = {
  type: "object",
  properties: {
    overview: {
      type: "object",
      properties: {
        subject: { type: "string" }, category: { type: "string" },
        summary: { type: "string" }, audience: { type: "string" },
        organizer: { "$ref": "#/$defs/quotedFinding" },
        location: { "$ref": "#/$defs/quotedFinding" },
      },
      required: ["subject", "category", "summary", "audience", "organizer", "location"],
    },
    announcementType: { "$ref": "#/$defs/quotedFinding" },
    keyFacts: { type: "array", maxItems: 40, items: { "$ref": "#/$defs/quotedFinding" } },
    importantDates: {
      type: "array", maxItems: 30, items: {
        type: "object", properties: {
          label: { type: "string" }, detail: { type: "string" }, originalWording: { type: "string" },
          sourceQuote: { type: "string" }, status: { type: "string", enum: ["stated", "ambiguous"] },
          precision: { type: "string", enum: ["exact", "approximate"] },
        }, required: ["label", "detail", "originalWording", "sourceQuote", "status", "precision"],
      },
    },
    benefits: { type: "array", maxItems: 30, items: { "$ref": "#/$defs/quotedFinding" } },
    contacts: { type: "array", maxItems: 20, items: {
      type: "object", properties: {
        type: { type: "string", enum: ["registration_url", "website", "email", "phone", "other"] },
        label: { type: "string" }, value: { type: "string" }, sourceQuote: { type: "string" },
      }, required: ["type", "label", "value", "sourceQuote"],
    } },
    eligibility: { type: "array", maxItems: 40, items: { "$ref": "#/$defs/quotedFinding" } },
    requirements: { type: "array", maxItems: 40, items: { "$ref": "#/$defs/quotedFinding" } },
    costsAndFees: { type: "array", maxItems: 30, items: { "$ref": "#/$defs/quotedFinding" } },
    actionItems: { type: "array", maxItems: 40, items: { "$ref": "#/$defs/quotedFinding" } },
    warnings: { type: "array", maxItems: 40, items: { "$ref": "#/$defs/quotedFinding" } },
    unknowns: { type: "array", maxItems: 40, items: {
      type: "object", properties: { label: { type: "string" }, detail: { type: "string" } }, required: ["label", "detail"],
    } },
    nextSteps: { type: "array", maxItems: 30, items: {
      type: "object", properties: { detail: { type: "string" }, sourceQuote: { type: "string" } }, required: ["detail", "sourceQuote"],
    } },
    translation: {
      type: "object", properties: {
        sourceLanguage: { type: "string" }, needed: { type: "boolean" }, summary: { type: "string" },
        keyPoints: { type: "array", maxItems: 12, items: { type: "string" } },
      }, required: ["sourceLanguage", "needed", "summary", "keyPoints"],
    },
  },
  required: ["overview", "announcementType", "keyFacts", "importantDates", "eligibility", "requirements", "costsAndFees", "actionItems", "warnings", "unknowns", "nextSteps", "benefits", "contacts", "translation"],
  $defs: {
    quotedFinding: {
      type: "object",
      properties: { label: { type: "string" }, detail: { type: "string" }, sourceQuote: { type: "string" } },
      required: ["label", "detail", "sourceQuote"],
    },
  },
} as const;
