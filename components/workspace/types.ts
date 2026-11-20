export type EvidenceStatus = "supported" | "needs-verification" | "unknown";

export type EvidenceAnchor = {
  id: string;
  paragraph: number;
  quote: string;
  status: Exclude<EvidenceStatus, "unknown">;
  page?: number;
};

export type Finding = {
  id: string;
  label: string;
  detail: string;
  status: EvidenceStatus;
  evidenceId?: string;
  kind?: "source-stated" | "interpretation" | "missing";
};

export type PrototypeAnalysis = {
  provider?: "local-demo" | "gemini" | "openrouter";
  modelId?: string;
  fallbackFrom?: "gemini" | "openrouter";
  fallbackReason?: string;
  durationMs?: number;
  overview?: {
    subject: string;
    category: string;
    summary: string;
    audience: string;
    organizer?: Finding;
    location?: Finding;
  };
  keyFacts?: Finding[];
  nextSteps?: Finding[];
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
