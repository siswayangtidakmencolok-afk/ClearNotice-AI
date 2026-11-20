import test from "node:test";
import assert from "node:assert/strict";
import { mapGeminiAnalysis } from "../lib/map-gemini-analysis.ts";

test("mapGeminiAnalysis maps verified quotes to exact source sentences", () => {
  const source =
    "The Ministry of Education announces the 2026 Innovation Grant. Applications close on May 31, 2026. Non-repayable grants up to IDR 100,000,000 are offered.";

  const mockGeminiOutput = {
    overview: {
      subject: "2026 Innovation Grant",
      category: "Public Grant",
      summary: "Grant for innovation.",
      audience: "Undergraduates",
      organizer: {
        label: "Organizer",
        detail: "Ministry of Education",
        sourceQuote: "The Ministry of Education announces the 2026 Innovation Grant.",
      },
      location: {
        label: "Location",
        detail: "Not stated in the source.",
        sourceQuote: "",
      },
    },
    announcementType: {
      label: "Notice Type",
      detail: "Public Grant",
      sourceQuote: "The Ministry of Education announces the 2026 Innovation Grant.",
    },
    keyFacts: [
      {
        label: "Funding Cap",
        detail: "IDR 100,000,000",
        sourceQuote: "Non-repayable grants up to IDR 100,000,000 are offered.",
      },
    ],
    importantDates: [
      {
        label: "Closing Date",
        detail: "May 31, 2026",
        originalWording: "May 31, 2026",
        sourceQuote: "Applications close on May 31, 2026.",
        status: "stated",
      },
    ],
    eligibility: [],
    requirements: [],
    costsAndFees: [],
    actionItems: [],
    warnings: [],
    unknowns: [],
    nextSteps: [],
  };

  const result = mapGeminiAnalysis(
    source,
    [1, 1, 1],
    mockGeminiOutput,
    "gemini",
    "gemini-3.8-flash",
  );

  assert.equal(result.provider, "gemini");
  assert.equal(result.modelId, "gemini-3.8-flash");
  assert.equal(result.evidence.length, 3);
  assert.equal(result.evidence[0].status, "supported");
  assert.equal(result.evidence[0].paragraph, 1);
  assert.equal(result.overview.organizer.status, "supported");
  assert.equal(result.overview.location.status, "unknown");
});

test("mapGeminiAnalysis flags quotes not found in source as unknown", () => {
  const source = "This is sentence one. This is sentence two.";
  const mockGeminiOutput = {
    overview: {
      subject: "Test",
      category: "Test",
      summary: "Test",
      audience: "Test",
      organizer: { label: "Org", detail: "Org", sourceQuote: "" },
      location: { label: "Loc", detail: "Loc", sourceQuote: "" },
    },
    announcementType: { label: "Type", detail: "Type", sourceQuote: "" },
    keyFacts: [
      {
        label: "Invented Claim",
        detail: "Some claim that does not exist in source",
        sourceQuote: "This sentence is completely hallucinated by AI.",
      },
    ],
    importantDates: [],
    eligibility: [],
    requirements: [],
    costsAndFees: [],
    actionItems: [],
    warnings: [],
    unknowns: [],
    nextSteps: [],
  };

  const result = mapGeminiAnalysis(source, [1], mockGeminiOutput, "gemini", "gemini-3.8-flash");
  // Invented quote is filtered out from keyFacts or flagged
  assert.equal(result.keyFacts.length, 0);
  // Unknowns records the unmatched citation
  const unmatched = result.unknowns.find((u) => u.label === "Unmatched AI citations");
  assert.ok(unmatched);
  assert.ok(unmatched.detail.includes("omitted"));
});
