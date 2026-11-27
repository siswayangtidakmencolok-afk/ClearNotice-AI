import test from "node:test";
import assert from "node:assert/strict";
import { mapGeminiAnalysis, isApproximateDate, normalizeForMatch } from "../lib/map-gemini-analysis.ts";
import { splitSentences } from "../lib/sentence-segmenter.ts";
import { pdfPageParagraphs } from "../lib/documents/pdf-paragraphs.ts";
import { geminiAnalysisSchema } from "../lib/analysis-schema.ts";

const empty = {
  overview: {
    subject: "S", category: "C", summary: "S", audience: "A",
    organizer: { label: "Organizer", detail: "Not stated in the source.", sourceQuote: "" },
    location: { label: "Location", detail: "Not stated in the source.", sourceQuote: "" },
  },
  announcementType: { label: "Type", detail: "Notice", sourceQuote: "" },
  keyFacts: [], importantDates: [], eligibility: [], requirements: [], costsAndFees: [], actionItems: [],
  warnings: [], unknowns: [], nextSteps: [], benefits: [], contacts: [],
  translation: { sourceLanguage: "English", needed: true, summary: "Ringkasan.", keyPoints: ["Poin satu"] },
};
const analysis = (overrides) => geminiAnalysisSchema.parse({ ...empty, ...overrides });

test("sentence splitting keeps emails, URLs, domains, and decimals inside one sentence", () => {
  assert.deepEqual(
    splitSentences("Contact fellowship@harborvalley.example.org. Apply at https://portal.example.org/apply now. GPA 3.0 is required."),
    ["Contact fellowship@harborvalley.example.org.", "Apply at https://portal.example.org/apply now.", "GPA 3.0 is required."],
  );
});

test("quotes match despite typographic apostrophes from PDF text", () => {
  const source = "Fellows get access to the Foundation’s field laboratory in Port Elwin.";
  assert.equal(normalizeForMatch("Foundation’s"), "Foundation's");
  const result = mapGeminiAnalysis(source, [1], analysis({
    benefits: [{ label: "Lab", detail: "Lab access", sourceQuote: "Fellows get access to the Foundation's field laboratory in Port Elwin." }],
  }));
  assert.equal(result.benefits.length, 1);
  assert.equal(result.evidence[0].quote, source);
});

test("a partial or multi-sentence quote anchors to its source sentence; invented text is rejected", () => {
  const source = "There is no application fee. Applications open on January 10, 2027.";
  const result = mapGeminiAnalysis(source, [2], analysis({
    // A model quote that drops the final period is still a contiguous part of the source sentence.
    costsAndFees: [{ label: "Fee", detail: "None", sourceQuote: "There is no application fee" }],
    // Fragments shorter than 20 characters are too ambiguous to count as evidence.
    eligibility: [{ label: "Short", detail: "x", sourceQuote: "no fee" }],
    keyFacts: [
      { label: "Both", detail: "x", sourceQuote: "There is no application fee. Applications open on January 10, 2027." },
      { label: "Invented", detail: "x", sourceQuote: "A fee of USD 50 applies to late applications." },
    ],
  }));
  assert.equal(result.costsAndFees[0].evidenceId, "E01");
  assert.equal(result.eligibility[0].status, "unknown");
  assert.deepEqual(result.keyFacts.map((item) => item.label), ["Both"]);
  assert.equal(result.evidence[0].page, 2);
  assert.ok(result.unknowns.some((item) => item.label === "Unmatched AI citations"));
});

test("dates are exact only when a calendar day is written and the wording is not hedged", () => {
  for (const exact of ["February 28, 2027", "28 Februari 2027", "10 January 2027", "2027-03-01", "Batas akhir 28 Februari 2027"]) {
    assert.equal(isApproximateDate(exact), false, exact);
  }
  for (const approximate of ["late March", "around mid-April", "sometime in early spring", "April 2027", "sekitar 12 Mei 2027", "akhir Maret"]) {
    assert.equal(isApproximateDate(approximate), true, approximate);
  }
});

test("an approximate date is flagged even when the model calls it exact and stated", () => {
  const source = "Results are announced in late March. The deadline is February 28, 2027.";
  const result = mapGeminiAnalysis(source, [1], analysis({
    importantDates: [
      { label: "Results", detail: "Late March", originalWording: "late March", sourceQuote: "Results are announced in late March.", status: "stated", precision: "exact" },
      { label: "Deadline", detail: "February 28, 2027", originalWording: "February 28, 2027", sourceQuote: "The deadline is February 28, 2027.", status: "stated", precision: "exact" },
    ],
  }));
  assert.deepEqual(result.importantDates.map((date) => [date.precision, date.status]), [["approximate", "needs-verification"], ["exact", "supported"]]);
  assert.deepEqual(result.evidence.map((anchor) => anchor.status), ["needs-verification", "supported"]);
});

test("contacts are kept only when written in the source; fabricated links are dropped", () => {
  const source = "Apply at https://portal.example.org/apply. Email fellowship@harborvalley.example.org or call +62 21 555 0199.";
  const result = mapGeminiAnalysis(source, [1], analysis({
    contacts: [
      { type: "registration_url", label: "Portal", value: "https://portal.example.org/apply", sourceQuote: "Apply at https://portal.example.org/apply." },
      { type: "email", label: "Email", value: "fellowship@harborvalley.example.org.", sourceQuote: "" },
      { type: "phone", label: "Phone", value: "(+62) 21-555-0199", sourceQuote: "" },
      { type: "website", label: "Guessed", value: "https://harborvalley.example.org", sourceQuote: "" },
      { type: "email", label: "Duplicate", value: "fellowship@harborvalley.example.org", sourceQuote: "" },
    ],
  }));
  assert.deepEqual(result.contacts.map((contact) => contact.value), ["https://portal.example.org/apply", "fellowship@harborvalley.example.org", "(+62) 21-555-0199"]);
  assert.ok(result.contacts.every((contact) => contact.evidenceId));
  assert.ok(result.unknowns.some((item) => item.label === "Unverified contact details" && item.detail.startsWith("1 ")));
});

test("unknowns are de-duplicated when the model and the mapper report the same missing field", () => {
  const result = mapGeminiAnalysis("A free coding bootcamp is offered.", [1], analysis({
    unknowns: [{ label: "Organizer", detail: "Not stated in the source." }, { label: "Location", detail: "Not stated." }, { label: "organizer", detail: "dup" }],
  }));
  assert.deepEqual(result.unknowns.map((item) => item.label), ["Organizer", "Location"]);
});

test("model unknowns that contradict verified findings are removed; real gaps stay", () => {
  const source = "Apply at https://portal.example.org/apply. There is no application fee.";
  const result = mapGeminiAnalysis(source, [1], analysis({
    costsAndFees: [{ label: "Fee", detail: "None", sourceQuote: "There is no application fee." }],
    contacts: [{ type: "registration_url", label: "Portal", value: "https://portal.example.org/apply", sourceQuote: "" }],
    unknowns: [
      { label: "Application link", detail: "Not stated in the source." },
      { label: "Cost", detail: "Not stated in the source." },
      { label: "Fellowship duration", detail: "Not stated in the source." },
    ],
  }));
  assert.deepEqual(result.unknowns.map((item) => item.label), ["Fellowship duration", "Organizer", "Location"]);
});

test("durations and frequencies are moved from the timeline to key facts", () => {
  const source = "Classes take place twice a week. Registration closes sometime in early spring.";
  const result = mapGeminiAnalysis(source, [1], analysis({
    importantDates: [
      { label: "Class frequency", detail: "Twice a week", originalWording: "twice a week", sourceQuote: "Classes take place twice a week.", status: "stated", precision: "exact" },
      { label: "Registration closes", detail: "Early spring", originalWording: "sometime in early spring", sourceQuote: "Registration closes sometime in early spring.", status: "ambiguous", precision: "approximate" },
    ],
  }));
  assert.deepEqual(result.importantDates.map((date) => date.label), ["Registration closes: sometime in early spring"]);
  assert.deepEqual(result.keyFacts.map((fact) => fact.label), ["Class frequency"]);
});

test("translation is passed through unchanged for the UI", () => {
  const result = mapGeminiAnalysis("A notice.", [1], analysis({}));
  assert.deepEqual(result.translation, empty.translation);
});

test("PDF page items are rebuilt into paragraphs using line gaps and hyphenated line breaks", () => {
  const line = (str, y, hasEOL = true) => ({ str, hasEOL, transform: [1, 0, 0, 1, 50, y], height: 11 });
  const items = [
    line("There is no application fee.", 790),
    line("Applications open on January 10, 2027. The application deadline is", 762),
    line("February 28, 2027. Shortlisted applicants work on student-", 748),
    line("led projects.", 734),
    line("For questions, contact fellowship@harborvalley.example.org.", 706, false),
  ];
  assert.deepEqual(pdfPageParagraphs(items), [
    "There is no application fee.",
    "Applications open on January 10, 2027. The application deadline is February 28, 2027. Shortlisted applicants work on student-led projects.",
    "For questions, contact fellowship@harborvalley.example.org.",
  ]);
});
