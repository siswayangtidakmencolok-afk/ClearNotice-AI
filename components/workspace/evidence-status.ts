import type { EvidenceStatus, Finding, PrototypeAnalysis } from "./types";

export function getEvidenceStatus(analysis: PrototypeAnalysis, evidenceId: string): EvidenceStatus {
  const findings: Finding[] = [
    analysis.announcementType,
    ...(analysis.keyFacts ?? []),
    ...analysis.importantDates,
    ...analysis.eligibility,
    ...analysis.requirements,
    ...analysis.costsAndFees,
    ...analysis.actionItems,
    ...analysis.warnings,
    ...(analysis.nextSteps ?? []),
  ];

  if (findings.some((finding) => finding.evidenceId === evidenceId && finding.status === "needs-verification")) {
    return "needs-verification";
  }

  return analysis.evidence.find((anchor) => anchor.id === evidenceId)?.status ?? "unknown";
}
