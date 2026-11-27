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
  /** Dates only: whether the source states a specific calendar day or an approximate time. */
  precision?: "exact" | "approximate";
};

export type ContactFinding = {
  id: string;
  type: "registration_url" | "website" | "email" | "phone" | "other";
  label: string;
  /** Copied verbatim from the source; contacts not found in the source text are dropped. */
  value: string;
  evidenceId?: string;
};

export type AnalysisTranslation = {
  sourceLanguage: string;
  needed: boolean;
  summary: string;
  keyPoints: string[];
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
  benefits?: Finding[];
  contacts?: ContactFinding[];
  translation?: AnalysisTranslation;
};
