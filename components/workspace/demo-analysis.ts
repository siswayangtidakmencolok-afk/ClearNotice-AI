import type { EvidenceAnchor, EvidenceStatus, Finding, PrototypeAnalysis } from "./types";

export const canonicalNsigAnnouncement = `The Ministry of Education, Culture, Research, and Technology (MoECRT), through the Directorate General of Higher Education, hereby announces the official commencement of the National Student Innovation Grant (NSIG) Fiscal Year 2026. This flagship competitive initiative is instituted to accelerate institutional scientific research, cross-disciplinary technological entrepreneurship, and commercial prototypes developed by collegiate scholars.

Eligible student proponents must be active undergraduate students (S1 / D4 degree tracks) enrolled in accredited public or private universities across Indonesia at the time of proposal intake. Candidate teams are required to submit interdisciplinary project teams consisting of a minimum of three (3) active undergraduates representing at least two distinct departments within STEAM disciplines.

Formal proposal intake opens electronically on April 15, 2026. The official submission window closes irreversibly on May 31, 2026 at 23:59 Western Indonesia Time (WIB). The program offers competitive non-repayable project grants of up to IDR 100,000,000 per selected proposal. Detailed technical guidelines, budget breakdown sheets, and institutional endorsement portals can be accessed through the official portal.

Late submissions, proposals exceeding the twenty (20) page maximum limit, or dossiers lacking formal Institutional Dean endorsement letter with stamp will be disqualified automatically during administrative pre-screening without administrative appeal or review extension.`;

export const demoAnnouncement = canonicalNsigAnnouncement;

export const canonicalNsigAnalysis: PrototypeAnalysis = {
  provider: "local-demo",
  modelId: "gemini-3.8-flash (Simulated Canonical Dossier)",
  overview: {
    subject: "National Student Innovation Grant (NSIG) Fiscal Year 2026",
    category: "Statutory Circular / Public Competitive Grant",
    summary:
      "The Ministry of Education, Culture, Research, and Technology (MoECRT) provides competitive non-repayable project grants up to IDR 100,000,000 for multidisciplinary undergraduate student innovation teams across Indonesian universities.",
    audience: "Active undergraduate students (S1/D4) in accredited universities across STEAM disciplines",
    organizer: {
      id: "org-01",
      label: "Issuing Authority",
      detail: "Directorate General of Higher Education, MoECRT Republic of Indonesia",
      status: "supported",
      evidenceId: "E01",
      kind: "source-stated",
    },
    location: {
      id: "loc-01",
      label: "Submission Portal",
      detail: "Electronic submission via official MoECRT portal (moecrt.go.id/nsig-2026)",
      status: "supported",
      evidenceId: "E03",
      kind: "source-stated",
    },
  },
  announcementType: {
    id: "ann-type",
    label: "Announcement Classification",
    detail: "Public Competitive Grant & Call for Proposals",
    status: "supported",
    evidenceId: "E01",
    kind: "source-stated",
  },
  keyFacts: [
    {
      id: "kf-01",
      label: "Maximum Grant Ceiling",
      detail: "Maximum non-repayable institutional grant funding is IDR 100,000,000 per multidisciplinary undergraduate project team.",
      status: "supported",
      evidenceId: "E02",
      kind: "source-stated",
    },
    {
      id: "kf-02",
      label: "Team Composition Requirement",
      detail: "Proposals must be authored by a minimum of 3 active undergraduates representing at least 2 distinct STEAM departments.",
      status: "supported",
      evidenceId: "E04",
      kind: "source-stated",
    },
  ],
  importantDates: [
    {
      id: "date-01",
      label: "Proposal Intake Opens",
      detail: "Electronic portal opens for proposal submissions.",
      status: "supported",
      evidenceId: "E05",
      kind: "source-stated",
    },
    {
      id: "date-02",
      label: "Strict Submission Deadline",
      detail: "May 31, 2026 at 23:59 Western Indonesia Time (WIB). Irreversible cutoff with no appeal.",
      status: "supported",
      evidenceId: "E05",
      kind: "source-stated",
    },
  ],
  eligibility: [
    {
      id: "elig-01",
      label: "Student Standing",
      detail: "Active undergraduate students in S1 or D4 degree tracks enrolled in accredited public or private universities.",
      status: "supported",
      evidenceId: "E04",
      kind: "source-stated",
    },
    {
      id: "elig-02",
      label: "Interdisciplinary Team",
      detail: "Minimum 3 undergraduate students representing at least two distinct departments in STEAM disciplines.",
      status: "supported",
      evidenceId: "E04",
      kind: "source-stated",
    },
  ],
  requirements: [
    {
      id: "req-01",
      label: "Maximum Length Limit",
      detail: "Dossiers must strictly not exceed twenty (20) pages total.",
      status: "supported",
      evidenceId: "E06",
      kind: "source-stated",
    },
    {
      id: "req-02",
      label: "Institutional Endorsement",
      detail: "Must include formal Institutional Dean endorsement letter with official university stamp.",
      status: "supported",
      evidenceId: "E06",
      kind: "source-stated",
    },
  ],
  costsAndFees: [
    {
      id: "cost-01",
      label: "Grant Award",
      detail: "Competitive non-repayable project grants of up to IDR 100,000,000 per selected proposal.",
      status: "supported",
      evidenceId: "E02",
      kind: "source-stated",
    },
    {
      id: "cost-02",
      label: "Application Fees",
      detail: "No submission fee or registration payment is mentioned in the circular.",
      status: "needs-verification",
      kind: "interpretation",
    },
  ],
  actionItems: [
    {
      id: "act-01",
      label: "Assemble Roster",
      detail: "Assemble multidisciplinary team of 3+ students across 2+ STEAM majors.",
      status: "supported",
      evidenceId: "E04",
      kind: "source-stated",
    },
    {
      id: "act-02",
      label: "Draft 20-Page Proposal",
      detail: "Prepare proposal under strict 20-page cap and allocate budget within IDR 100,000,000 ceiling.",
      status: "supported",
      evidenceId: "E06",
      kind: "source-stated",
    },
    {
      id: "act-03",
      label: "Procure Dean Endorsement",
      detail: "Obtain faculty Dean signature and institutional stamp prior to May 31 deadline.",
      status: "supported",
      evidenceId: "E06",
      kind: "source-stated",
    },
  ],
  warnings: [
    {
      id: "warn-01",
      label: "Automatic Disqualification",
      detail: "Late submissions, proposals exceeding 20 pages, or lacking Dean endorsement stamp are automatically disqualified without review or appeal.",
      status: "supported",
      evidenceId: "E06",
      kind: "source-stated",
    },
  ],
  unknowns: [
    {
      id: "unk-01",
      label: "Matching Funds / Co-Funding",
      detail: "Circular does not specify whether matching funds from university or industry partners are allowed or required.",
      status: "unknown",
      kind: "missing",
    },
    {
      id: "unk-02",
      label: "Tranche Disbursement Schedule",
      detail: "Exact milestone disbursement percentages (e.g., 70/30) are not defined in the primary circular.",
      status: "unknown",
      kind: "missing",
    },
  ],
  nextSteps: [
    {
      id: "ns-01",
      label: "1. Assemble Roster",
      detail: "Confirm 3+ active undergraduate students spanning at least two different STEAM majors.",
      status: "supported",
      evidenceId: "E04",
      kind: "source-stated",
    },
    {
      id: "ns-02",
      label: "2. Draft Proposal & Budget",
      detail: "Ensure total budget ask does not exceed IDR 100,000,000 and total annexes do not exceed 20 pages.",
      status: "supported",
      evidenceId: "E06",
      kind: "source-stated",
    },
    {
      id: "ns-03",
      label: "3. Procure Dean Endorsement",
      detail: "Mandatory signature and university stamp required prior to portal closing on May 31.",
      status: "supported",
      evidenceId: "E06",
      kind: "source-stated",
    },
  ],
  evidence: [
    {
      id: "E01",
      paragraph: 1,
      quote:
        "The Ministry of Education, Culture, Research, and Technology (MoECRT), through the Directorate General of Higher Education, hereby announces the official commencement of the National Student Innovation Grant (NSIG) Fiscal Year 2026.",
      status: "supported",
    },
    {
      id: "E02",
      paragraph: 3,
      quote:
        "The program offers competitive non-repayable project grants of up to IDR 100,000,000 per selected proposal.",
      status: "supported",
    },
    {
      id: "E03",
      paragraph: 3,
      quote:
        "Detailed technical guidelines, budget breakdown sheets, and institutional endorsement portals can be accessed through the official portal.",
      status: "needs-verification",
    },
    {
      id: "E04",
      paragraph: 2,
      quote:
        "Candidate teams are required to submit interdisciplinary project teams consisting of a minimum of three (3) active undergraduates representing at least two distinct departments within STEAM disciplines.",
      status: "supported",
    },
    {
      id: "E05",
      paragraph: 3,
      quote:
        "The official submission window closes irreversibly on May 31, 2026 at 23:59 Western Indonesia Time (WIB).",
      status: "supported",
    },
    {
      id: "E06",
      paragraph: 4,
      quote:
        "Late submissions, proposals exceeding the twenty (20) page maximum limit, or dossiers lacking formal Institutional Dean endorsement letter with stamp will be disqualified automatically during administrative pre-screening without administrative appeal or review extension.",
      status: "supported",
    },
  ],
};

type SourceSentence = {
  paragraph: number;
  quote: string;
};

const datePattern =
  /\b(?:\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/i;

function splitSentences(paragraph: string): string[] {
  const sentences: string[] = [];
  let start = 0;

  for (let index = 0; index < paragraph.length; index += 1) {
    const punctuation = paragraph[index];
    const isDecimalPoint =
      punctuation === "." && /\d/.test(paragraph[index - 1] ?? "") && /\d/.test(paragraph[index + 1] ?? "");
    if (!/[.!?]/.test(punctuation) || isDecimalPoint) continue;

    let end = index + 1;
    while (/[.!?]/.test(paragraph[end] ?? "")) end += 1;
    const sentence = paragraph.slice(start, end).trim();
    if (sentence) sentences.push(sentence);
    start = end;
    index = end - 1;
  }

  const remainder = paragraph.slice(start).trim();
  if (remainder) sentences.push(remainder);
  return sentences;
}

export function getSourceSentences(text: string): SourceSentence[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .flatMap((paragraphText, index) =>
      splitSentences(paragraphText).map((quote) => ({ paragraph: index + 1, quote })),
    );
}

function isAmbiguous(quote: string): boolean {
  return /\b(?:expected|approximately|around|may|might|could|estimated|to be confirmed|tbc)\b/i.test(
    quote,
  ) || /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/.test(quote);
}

function classifyDate(quote: string): string {
  if (/\bpublished|publication date|issued on\b/i.test(quote)) return "Publication date";
  if (/\bregistration\b.*\bopens?|open from\b/i.test(quote)) return "Registration opens";
  if (/\bdeadline|closes?|closing|due by|applications close\b/i.test(quote)) {
    return "Application deadline";
  }
  if (/\bsubmission\b|\bsubmit by\b/i.test(quote)) return "Submission deadline";
  if (/\bevent|workshop|conference|takes place|held on\b/i.test(quote)) return "Event date";
  return "Date mention";
}

export function analyzePrototype(text: string): PrototypeAnalysis {
  if (text.includes("National Student Innovation Grant") || text.includes("NSIG")) {
    return canonicalNsigAnalysis;
  }

  const sentences = getSourceSentences(text);
  const evidenceBySource = new Map<string, EvidenceAnchor>();
  const findings: Finding[] = [];

  const addFinding = (label: string, sentence: SourceSentence): Finding => {
    const sourceKey = `${sentence.paragraph}\u0000${sentence.quote}`;
    let anchor = evidenceBySource.get(sourceKey);
    if (!anchor) {
      anchor = {
        id: `E${String(evidenceBySource.size + 1).padStart(2, "0")}`,
        paragraph: sentence.paragraph,
        quote: sentence.quote,
        status: isAmbiguous(sentence.quote) ? "needs-verification" : "supported",
      };
      evidenceBySource.set(sourceKey, anchor);
    }

    const finding: Finding = {
      id: `${label}-${anchor.id}`,
      label,
      detail: sentence.quote,
      status: anchor.status,
      evidenceId: anchor.id,
      kind: anchor.status === "needs-verification" ? "interpretation" : "source-stated",
    };
    findings.push(finding);
    return finding;
  };

  const fromMatches = (label: string, pattern: RegExp): Finding[] =>
    sentences.filter(({ quote }) => pattern.test(quote)).map((sentence) => addFinding(label, sentence));

  const unknown = (label: string, detail: string, status: EvidenceStatus = "unknown"): Finding => {
    const finding = { id: `U${String(findings.length + 1).padStart(2, "0")}`, label, detail, status, kind: "missing" as const };
    findings.push(finding);
    return finding;
  };

  const typeCues = [
    { pattern: /\bscholarship|grant|fellowship\b/i, label: "Possible scholarship or funding notice" },
    { pattern: /\bcompetition\b/i, label: "Possible competition notice" },
    { pattern: /\bworkshop|conference|course|event\b/i, label: "Possible event or learning notice" },
  ];
  const typeMatch = sentences.flatMap((sentence) => {
    const cue = typeCues.find(({ pattern }) => pattern.test(sentence.quote));
    return cue ? [{ sentence, cue }] : [];
  })[0];
  const announcementType = typeMatch
    ? {
        ...addFinding("Tentative announcement type", typeMatch.sentence),
        detail: typeMatch.cue.label,
        status: "needs-verification" as const,
      }
    : unknown("Announcement type", "The pasted text does not clearly identify a notice type.");

  const importantDates = fromMatches(
    "Date or deadline mention",
    datePattern,
  ).map((finding) => {
    const anchor = finding.evidenceId
      ? Array.from(evidenceBySource.values()).find((item) => item.id === finding.evidenceId)
      : undefined;
    return {
      ...finding,
      label: anchor ? classifyDate(anchor.quote) : "Date mention",
    };
  });
  for (const sentence of sentences) {
    if (
      !datePattern.test(sentence.quote) &&
      /\b(?:deadline|closing date|closing day|closes|due by|submission date|event date)\b/i.test(sentence.quote)
    ) {
      const finding = addFinding("Date reference", sentence);
      importantDates.push({
        ...finding,
        label: "Deadline referenced, exact date unclear",
        status: "needs-verification",
      });
    }
  }

  const eligibility = fromMatches(
    "Eligibility",
    /\beligib(?:le|ility)|must be|students? (?:must|should|are)|minimum GPA|enrolled\b/i,
  );
  const requirements = fromMatches(
    "Requirement",
    /\brequired documents?|must submit|must provide|transcript|recommendation letter|proof of|upload\b/i,
  );
  const costsAndFees = fromMatches("Cost or fee", /\bapplication fee|registration fee|tuition|costs?|free of charge|payment\b|\b(?:USD|IDR|EUR|GBP)\b/i);
  const actionItems = fromMatches(
    "Action from source",
    /\bmust (?:submit|register|prepare|upload|complete)|should (?:submit|register|prepare|upload|complete)|are advised to|before the deadline|before the closing\b/i,
  );
  const warnings = fromMatches(
    "Warning",
    /\blate|incomplete|disqualif|not be accepted|strictly|without appeal\b/i,
  );

  const unknowns = [
    ...(importantDates.length
      ? []
      : [unknown("Date information", "No clear date or deadline was found in the pasted text.")]),
    ...(eligibility.length
      ? []
      : [unknown("Eligibility", "Eligibility details are not stated in the pasted text.")]),
    ...(requirements.length
      ? []
      : [unknown("Requirements", "Required documents or submission requirements are not stated.")]),
    ...(costsAndFees.length
      ? []
      : [unknown("Costs and fees", "No application fee or cost information was found.")]),
    ...(actionItems.length
      ? []
      : [unknown("Action items", "No explicit next action was found in the pasted text.")]),
  ];

  const missingFinding = (label: string): Finding => {
    const finding = unknowns.find((item) => item.label === label);
    if (!finding) return { id: `U-missing-${label}`, label, detail: `${label} information not specified in source.`, status: "unknown", kind: "missing" };
    return finding;
  };

  return {
    provider: "local-demo",
    modelId: "Local Rule Engine",
    overview: {
      subject: "Announcement Investigation",
      category: announcementType.detail,
      summary: "Preliminary prototype extraction based on lexical patterns in the source.",
      audience: "Not stated in the source.",
    },
    announcementType,
    importantDates,
    eligibility: eligibility.length > 0 ? eligibility : [missingFinding("Eligibility")],
    requirements: requirements.length > 0 ? requirements : [missingFinding("Requirements")],
    costsAndFees: costsAndFees.length > 0 ? costsAndFees : [missingFinding("Costs and fees")],
    actionItems: actionItems.length > 0 ? actionItems : [missingFinding("Action items")],
    warnings: warnings.length > 0 ? warnings : [],
    unknowns,
    evidence: Array.from(evidenceBySource.values()),
  };
}
