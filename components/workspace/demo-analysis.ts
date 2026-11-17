import type { EvidenceAnchor, EvidenceStatus, Finding, PrototypeAnalysis } from "./types";

export const demoAnnouncement = `The National STEM Scholarship 2026 is now open for final-year students in science and technology programs.

Eligible applicants must be currently enrolled in an accredited university and have a minimum GPA of 3.30. Applications close on 18 October 2026 at 11:59 PM.

The selection process includes a written essay, recommendation letter, and online interview. Required documents include student ID, transcript, CV, and proof of active enrollment.

Applicants are advised to prepare a statement of purpose and ensure their documents are uploaded before the deadline. Please note that late applications will not be accepted and incomplete files will be disqualified. If you have not yet submitted your proof of enrollment, do it before the closing day.`;

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
    };
    findings.push(finding);
    return finding;
  };

  const fromMatches = (label: string, pattern: RegExp): Finding[] =>
    sentences.filter(({ quote }) => pattern.test(quote)).map((sentence) => addFinding(label, sentence));

  const unknown = (label: string, detail: string, status: EvidenceStatus = "unknown"): Finding => {
    const finding = { id: `U${String(findings.length + 1).padStart(2, "0")}`, label, detail, status };
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
    if (!finding) throw new Error(`Missing expected unknown finding: ${label}`);
    return finding;
  };

  return {
    announcementType,
    importantDates,
    eligibility:
      eligibility.length > 0
        ? eligibility
        : [missingFinding("Eligibility")],
    requirements:
      requirements.length > 0
        ? requirements
        : [missingFinding("Requirements")],
    costsAndFees:
      costsAndFees.length > 0
        ? costsAndFees
        : [missingFinding("Costs and fees")],
    actionItems:
      actionItems.length > 0
        ? actionItems
        : [missingFinding("Action items")],
    warnings:
      warnings.length > 0
        ? warnings
        : [],
    unknowns,
    evidence: Array.from(evidenceBySource.values()),
  };
}
