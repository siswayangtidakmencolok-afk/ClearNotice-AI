import { getSourceSentences, type SourceSentence } from "./sentence-segmenter";
import type { ContactFinding, EvidenceAnchor, Finding, PrototypeAnalysis } from "@/components/workspace/types";
import type { GeminiAnalysis } from "./analysis-schema";
import type { AIProviderId } from "./ai/types";

/** Whitespace, typographic quotes, and dash variants differ between PDF text and model output. */
export function normalizeForMatch(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, "\"")
    .replace(/[‐-―−]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

const MIN_PARTIAL_QUOTE_CHARS = 20;

/**
 * Finds the source sentence a quote comes from. Accepts an exact sentence, a contiguous part of
 * one sentence (at least 20 characters), or a run of whole sentences copied together. Anything
 * that is not literally present in the source is rejected.
 */
function locateQuote(quote: string, sentences: Array<SourceSentence & { normalized: string }>, paragraphs: string[]) {
  const target = normalizeForMatch(quote);
  if (!target) return undefined;
  const exact = sentences.find((sentence) => sentence.normalized === target);
  if (exact) return exact;
  if (target.length < MIN_PARTIAL_QUOTE_CHARS) return undefined;
  const containing = sentences.find((sentence) => sentence.normalized.includes(target));
  if (containing) return containing;
  return sentences.find((sentence) =>
    target.startsWith(sentence.normalized) && normalizeForMatch(paragraphs[sentence.paragraph - 1] ?? "").includes(target));
}

const MONTH = "(?:jan(?:uary|uari)?|feb(?:ruary|ruari)?|mar(?:ch|et)?|apr(?:il)?|ma[yi]|jun(?:e|i)?|jul(?:y|i)?|aug(?:ust)?|agu(?:stus)?|sep(?:t(?:ember)?)?|oct(?:ober)?|okt(?:ober)?|nov(?:ember)?|dec(?:ember)?|des(?:ember)?)";
const SPECIFIC_DAY = new RegExp(`\\b\\d{1,2}\\s+${MONTH}\\b|\\b${MONTH}\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?\\b|\\b\\d{1,2}[/.-]\\d{1,2}[/.-]\\d{2,4}\\b|\\b\\d{4}-\\d{2}-\\d{2}\\b`, "i");
const HEDGED = /\b(?:around|about|approximately|approx|expected|estimated|tentative(?:ly)?|tbc|tba|to be (?:confirmed|announced)|sekitar|kurang lebih|perkiraan|diperkirakan|tentatif|menyusul)\b/i;

/** A date is exact only when a specific calendar day is written and the wording is not hedged. */
export function isApproximateDate(wording: string) {
  return !SPECIFIC_DAY.test(wording) || HEDGED.test(wording);
}

const DATE_LIKE = new RegExp(`\\b${MONTH}\\b|\\b(?:spring|summer|autumn|fall|winter|musim|semester|quarter|kuartal)\\b|\\b(?:19|20)\\d{2}\\b|\\b\\d{1,2}[/.-]\\d{1,2}\\b|\\b\\d{1,2}[:.]\\d{2}\\b`, "i");

/** Durations and frequencies ("over eight weeks", "twice a week", "soon") are not points in time. */
export function isDateLike(wording: string) {
  return DATE_LIKE.test(wording);
}

// A model-reported unknown is dropped when a verified finding already answers that topic, so the
// result never says "not stated" next to the information it found.
const COVERED_TOPICS: Array<{ pattern: RegExp; covered: (analysis: PrototypeAnalysis) => boolean }> = [
  { pattern: /\b(?:link|url|website|portal|situs|tautan)\b/i, covered: (a) => (a.contacts ?? []).some((c) => c.type === "registration_url" || c.type === "website") },
  { pattern: /\b(?:e-?mail|phone|telephone|contact|kontak|telepon|surel)\b/i, covered: (a) => (a.contacts ?? []).some((c) => c.type === "email" || c.type === "phone") },
  { pattern: /\b(?:cost|costs|fee|fees|biaya|price|tuition)\b/i, covered: (a) => a.costsAndFees.some((f) => f.status !== "unknown") },
  { pattern: /\b(?:location|venue|lokasi|tempat)\b/i, covered: (a) => a.overview?.location?.status !== "unknown" },
  { pattern: /\b(?:organi[sz]er|penyelenggara)\b/i, covered: (a) => a.overview?.organizer?.status !== "unknown" },
  { pattern: /\b(?:benefits?|stipend|manfaat|funding)\b/i, covered: (a) => (a.benefits ?? []).some((f) => f.status !== "unknown") },
  { pattern: /\b(?:eligibility|eligible|syarat)\b/i, covered: (a) => a.eligibility.some((f) => f.status !== "unknown") },
  { pattern: /\b(?:deadline|batas)\b/i, covered: (a) => a.importantDates.some((d) => d.precision === "exact" && /deadline|close|closing|due|batas/i.test(d.label)) },
];

function labelKey(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

export function mapGeminiAnalysis(
  source: string,
  paragraphPages: Array<number | null>,
  result: GeminiAnalysis,
  provider: AIProviderId = "gemini",
  modelId?: string,
  fallbackFrom?: AIProviderId,
  fallbackReason?: string,
  durationMs?: number,
): PrototypeAnalysis {
  const sourceParagraphs = source.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
  const sourceSentences = getSourceSentences(source).map((sentence) => ({ ...sentence, normalized: normalizeForMatch(sentence.quote) }));
  const evidenceByQuote = new Map<string, EvidenceAnchor>();
  const unlinked: string[] = [];

  const anchorFor = (sentence: SourceSentence) => {
    const key = `${sentence.paragraph}\u0000${sentence.quote}`;
    let anchor = evidenceByQuote.get(key);
    if (!anchor) {
      anchor = {
        id: `E${String(evidenceByQuote.size + 1).padStart(2, "0")}`,
        paragraph: sentence.paragraph,
        quote: sentence.quote,
        status: sourceParagraphs[sentence.paragraph - 1] ? "supported" : "needs-verification",
        page: paragraphPages[sentence.paragraph - 1] ?? undefined,
      };
      evidenceByQuote.set(key, anchor);
    }
    return anchor;
  };

  // An evidence anchor describes the source sentence itself: it is "supported" when the quote
  // is found in the source, and only flagged when the source wording is ambiguous or the
  // paragraph cannot be located. A finding's own interpretive status stays on the finding, so an
  // anchor's status never depends on which finding happened to reference the sentence first.
  const finding = (
    label: string,
    detail: string,
    quote: string | null,
    status: Finding["status"] = "supported",
    sourceWordingAmbiguous = false,
  ): Finding => {
    if (!quote) return { id: `I${String(evidenceByQuote.size + unlinked.length + 1).padStart(2, "0")}`, label, detail, status: "needs-verification", kind: "interpretation" };
    const matched = locateQuote(quote, sourceSentences, sourceParagraphs);
    if (!matched) {
      unlinked.push(label);
      return {
        id: `U${String(unlinked.length).padStart(2, "0")}`,
        label,
        detail: "This item could not be verified against the source.",
        status: "unknown",
        kind: "missing",
      };
    }
    const anchor = anchorFor(matched);
    if (sourceWordingAmbiguous) anchor.status = "needs-verification";
    return {
      id: `${label}-${anchor.id}`,
      label,
      detail,
      status,
      evidenceId: anchor.id,
      kind: status === "needs-verification" ? "interpretation" : "source-stated",
    };
  };

  const verified = (items: Finding[]) => items.filter((item) => item.status !== "unknown");
  const mapQuotes = (items: Array<{ label: string; detail: string; sourceQuote: string }>) =>
    verified(items.map((item) => finding(item.label, item.detail, item.sourceQuote)));

  const announcementType = finding("Announcement category", result.announcementType.detail, result.announcementType.sourceQuote, "needs-verification");
  // Items without a point in time are kept as key facts instead of appearing on the timeline.
  const datedItems = result.importantDates.filter((date) => isDateLike(`${date.originalWording} ${date.detail}`));
  const undatedItems = result.importantDates.filter((date) => !datedItems.includes(date));
  const keyFacts = mapQuotes([...result.keyFacts, ...undatedItems.map((date) => ({ label: date.label, detail: date.detail, sourceQuote: date.sourceQuote }))]);
  const importantDates = verified(datedItems.map((date) => {
    const approximate = date.precision === "approximate" || date.status === "ambiguous" || isApproximateDate(date.originalWording || date.detail);
    return {
      ...finding(
        `${date.label}: ${date.originalWording}`,
        date.detail,
        date.sourceQuote,
        approximate ? "needs-verification" : "supported",
        approximate,
      ),
      precision: approximate ? "approximate" as const : "exact" as const,
    };
  }));
  const eligibility = mapQuotes(result.eligibility);
  const requirements = mapQuotes(result.requirements);
  const costsAndFees = mapQuotes(result.costsAndFees);
  const actionItems = mapQuotes(result.actionItems);
  const warnings = mapQuotes(result.warnings);
  const benefits = mapQuotes(result.benefits);

  // Contacts must appear in the source text itself; a link or number the model produced but the
  // notice does not contain is dropped rather than shown.
  const normalizedSource = normalizeForMatch(source).toLowerCase();
  const sourceDigits = digits(source);
  const seenContacts = new Set<string>();
  let droppedContacts = 0;
  const contacts: ContactFinding[] = [];
  for (const contact of result.contacts) {
    const value = contact.value.trim().replace(/[.,;:]+$/, "");
    const present = contact.type === "phone"
      ? digits(value).length >= 6 && sourceDigits.includes(digits(value))
      : value.length > 3 && normalizedSource.includes(normalizeForMatch(value).toLowerCase());
    const key = `${contact.type}\u0000${value.toLowerCase()}`;
    if (!present) { droppedContacts += 1; continue; }
    if (seenContacts.has(key)) continue;
    seenContacts.add(key);
    const sentence = (contact.sourceQuote && locateQuote(contact.sourceQuote, sourceSentences, sourceParagraphs))
      || sourceSentences.find((item) => contact.type === "phone"
        ? digits(item.quote).includes(digits(value))
        : item.normalized.toLowerCase().includes(normalizeForMatch(value).toLowerCase()));
    contacts.push({
      id: `C${String(contacts.length + 1).padStart(2, "0")}`,
      type: contact.type,
      label: contact.label,
      value,
      evidenceId: sentence ? anchorFor(sentence).id : undefined,
    });
  }

  const organizer = result.overview.organizer.sourceQuote
    ? finding("Organizer", result.overview.organizer.detail, result.overview.organizer.sourceQuote)
    : { id: "U-organizer", label: "Organizer", detail: result.overview.organizer.detail || "Not stated in the source.", status: "unknown" as const, kind: "missing" as const };
  const location = result.overview.location.sourceQuote
    ? finding("Location", result.overview.location.detail, result.overview.location.sourceQuote)
    : { id: "U-location", label: "Location", detail: result.overview.location.detail || "Not stated in the source.", status: "unknown" as const, kind: "missing" as const };
  const nextSteps = verified(result.nextSteps.map((item, index) => finding(
    `Suggested next step ${index + 1}`,
    item.detail,
    item.sourceQuote,
    item.sourceQuote ? "supported" : "needs-verification",
  )));

  // One entry per missing topic: the model's own unknowns, then fields this mapping found missing.
  const unknowns: Finding[] = [];
  const unknownKeys = new Set<string>();
  const addUnknown = (label: string, detail: string) => {
    const key = labelKey(label);
    if (!key || unknownKeys.has(key)) return;
    unknownKeys.add(key);
    unknowns.push({ id: `U${String(unknowns.length + 1).padStart(2, "0")}`, label, detail, status: "unknown", kind: "missing" });
  };
  for (const item of result.unknowns) addUnknown(item.label, item.detail);
  if (organizer.status === "unknown") addUnknown("Organizer", organizer.detail);
  if (location.status === "unknown") addUnknown("Location", location.detail);
  if (unlinked.length) {
    addUnknown("Unmatched AI citations", `${unlinked.length} model-suggested item(s) had quotations that were not found in the supplied source and were omitted.`);
  }
  if (droppedContacts) {
    addUnknown("Unverified contact details", `${droppedContacts} contact detail(s) suggested by the model were not written in the source and were omitted.`);
  }

  const mapped: PrototypeAnalysis = {
    provider,
    modelId,
    fallbackFrom,
    fallbackReason,
    durationMs,
    overview: {
      subject: result.overview.subject,
      category: result.overview.category,
      summary: result.overview.summary,
      audience: result.overview.audience,
      organizer,
      location,
    },
    keyFacts,
    nextSteps,
    announcementType,
    importantDates,
    eligibility: eligibility.length ? eligibility : [unknowns.find((item) => item.label === "Eligibility") ?? {
      id: "U-eligibility", label: "Eligibility", detail: "Eligibility details were not found in the supplied source.", status: "unknown", kind: "missing",
    }],
    requirements: requirements.length ? requirements : [unknowns.find((item) => item.label === "Requirements") ?? {
      id: "U-requirements", label: "Requirements", detail: "Requirements were not found in the supplied source.", status: "unknown", kind: "missing",
    }],
    costsAndFees: costsAndFees.length ? costsAndFees : [unknowns.find((item) => item.label === "Costs and fees") ?? {
      id: "U-costs", label: "Costs and fees", detail: "Cost information was not found in the supplied source.", status: "unknown", kind: "missing",
    }],
    actionItems: actionItems.length ? actionItems : [unknowns.find((item) => item.label === "Action items") ?? {
      id: "U-actions", label: "Action items", detail: "No required action was found in the supplied source.", status: "unknown", kind: "missing",
    }],
    warnings,
    unknowns,
    benefits,
    contacts,
    translation: result.translation,
    evidence: Array.from(evidenceByQuote.values()),
  };
  const modelUnknownLabels = new Set(result.unknowns.map((item) => labelKey(item.label)));
  mapped.unknowns = unknowns.filter((item) => !modelUnknownLabels.has(labelKey(item.label))
    || !COVERED_TOPICS.some((topic) => topic.pattern.test(item.label) && topic.covered(mapped)));
  return mapped;
}
