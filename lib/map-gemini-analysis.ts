import { getSourceSentences } from "@/components/workspace/demo-analysis";
import type { EvidenceAnchor, Finding, PrototypeAnalysis } from "@/components/workspace/types";
import type { GeminiAnalysis } from "./analysis-schema";
import type { AIProviderId } from "./ai/types";

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim();
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
  const sourceSentences = getSourceSentences(source);
  const evidenceByQuote = new Map<string, EvidenceAnchor>();
  const unlinked: string[] = [];

  const finding = (label: string, detail: string, quote: string | null, status: Finding["status"] = "supported"): Finding => {
    if (!quote) return { id: `I${String(evidenceByQuote.size + unlinked.length + 1).padStart(2, "0")}`, label, detail, status: "needs-verification", kind: "interpretation" };
    const normalizedQuote = normalize(quote);
    const matched = sourceSentences.find((sentence) => normalize(sentence.quote) === normalizedQuote);
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

    const key = `${matched.paragraph}\u0000${matched.quote}`;
    let anchor = evidenceByQuote.get(key);
    if (!anchor) {
      const paragraphText = sourceParagraphs[matched.paragraph - 1] ?? "";
      anchor = {
        id: `E${String(evidenceByQuote.size + 1).padStart(2, "0")}`,
        paragraph: matched.paragraph,
        quote: matched.quote,
        status: status === "needs-verification" ? "needs-verification" : "supported",
        page: paragraphPages[matched.paragraph - 1] ?? undefined,
      };
      if (!paragraphText) anchor.status = "needs-verification";
      evidenceByQuote.set(key, anchor);
    }
    return {
      id: `${label}-${anchor.id}`,
      label,
      detail,
      status,
      evidenceId: anchor.id,
      kind: status === "needs-verification" ? "interpretation" : "source-stated",
    };
  };

  const mapQuotes = (items: Array<{ label: string; detail: string; sourceQuote: string }>) =>
    items.map((item) => finding(item.label, item.detail, item.sourceQuote));

  const announcementType = finding("Announcement category", result.announcementType.detail, result.announcementType.sourceQuote, "needs-verification");
  const keyFacts = mapQuotes(result.keyFacts).filter((item) => item.status !== "unknown");
  const importantDates = result.importantDates.map((date) => finding(
    `${date.label}: ${date.originalWording}`,
    date.detail,
    date.sourceQuote,
    date.status === "ambiguous" ? "needs-verification" : "supported",
  )).filter((item) => item.status !== "unknown");
  const eligibility = mapQuotes(result.eligibility).filter((item) => item.status !== "unknown");
  const requirements = mapQuotes(result.requirements).filter((item) => item.status !== "unknown");
  const costsAndFees = mapQuotes(result.costsAndFees).filter((item) => item.status !== "unknown");
  const actionItems = mapQuotes(result.actionItems).filter((item) => item.status !== "unknown");
  const warnings = mapQuotes(result.warnings).filter((item) => item.status !== "unknown");
  const organizer = result.overview.organizer.sourceQuote
    ? finding("Organizer", result.overview.organizer.detail, result.overview.organizer.sourceQuote)
    : { id: "U-organizer", label: "Organizer", detail: result.overview.organizer.detail || "Not stated in the source.", status: "unknown" as const, kind: "missing" as const };
  const location = result.overview.location.sourceQuote
    ? finding("Location", result.overview.location.detail, result.overview.location.sourceQuote)
    : { id: "U-location", label: "Location", detail: result.overview.location.detail || "Not stated in the source.", status: "unknown" as const, kind: "missing" as const };
  const unknowns: Finding[] = result.unknowns.map((item, index) => ({
    id: `U${String(index + 1).padStart(2, "0")}`,
    label: item.label,
    detail: item.detail,
    status: "unknown",
    kind: "missing",
  }));
  if (organizer.status === "unknown") unknowns.push(organizer);
  if (location.status === "unknown") unknowns.push(location);
  if (unlinked.length) {
    unknowns.push({
      id: `U${String(unknowns.length + 1).padStart(2, "0")}`,
      label: "Unmatched AI citations",
      detail: `${unlinked.length} model-suggested item(s) had quotations that did not match a complete sentence in the supplied source and were omitted.`,
      status: "unknown",
      kind: "missing",
    });
  }
  const nextSteps = result.nextSteps.map((item, index) => finding(
    `Suggested next step ${index + 1}`,
    item.detail,
    item.sourceQuote,
    item.sourceQuote ? "supported" : "needs-verification",
  ));

  return {
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
    evidence: Array.from(evidenceByQuote.values()),
  };
}
