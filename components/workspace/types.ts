export type EvidenceStatus = "supported" | "needs-verification" | "unknown";

export type EvidenceAnchor = {
  id: string;
  paragraph: number;
  quote: string;
  status: Exclude<EvidenceStatus, "unknown">;
};

export type Finding = {
  id: string;
  label: string;
  detail: string;
  status: EvidenceStatus;
  evidenceId?: string;
};

export type PrototypeAnalysis = {
  announcementType: Finding;
  importantDates: Finding[];
  eligibility: Finding[];
  requirements: Finding[];
  costsAndFees: Finding[];
  actionItems: Finding[];
  warnings: Finding[];
  unknowns: Finding[];
  evidence: EvidenceAnchor[];
};
