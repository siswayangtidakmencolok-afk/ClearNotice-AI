"use client";

import { useState } from "react";

type FactItem = {
  label: string;
  value: string;
};

type AnalysisResult = {
  title: string;
  summary: string;
  importantDates: string[];
  registrationDeadline: string;
  eventSchedule: string[];
  eligibilityRequirements: string[];
  requiredDocuments: string[];
  requiredActions: string[];
  warnings: string[];
  missingInformation: string[];
  sourceEvidence: FactItem[];
};

const sampleAnnouncement = `The National STEM Scholarship 2026 is now open for final-year students in science and technology programs. Eligible applicants must be currently enrolled in an accredited university and have a minimum GPA of 3.30. Applications close on 18 October 2026 at 11:59 PM. The selection process includes a written essay, recommendation letter, and online interview. Required documents include student ID, transcript, CV, and proof of active enrollment. Applicants are advised to prepare a statement of purpose and ensure their documents are uploaded before the deadline. Please note that late applications will not be accepted and incomplete files will be disqualified. If you have not yet submitted your proof of enrollment, do it before the closing day.`;

const emptyResult: AnalysisResult = {
  title: "No announcement analyzed yet",
  summary:
    "Paste an announcement to generate a structured brief with deadlines, eligibility, actions, and source evidence.",
  importantDates: ["No dates extracted yet"],
  registrationDeadline: "Not available",
  eventSchedule: ["No schedule available yet"],
  eligibilityRequirements: ["No eligibility details available yet"],
  requiredDocuments: ["No required documents available yet"],
  requiredActions: ["Paste a source announcement to begin"],
  warnings: ["No warnings flagged yet"],
  missingInformation: ["Awaiting source text"],
  sourceEvidence: [{ label: "Source status", value: "No evidence extracted yet" }],
};

function parseAnnouncement(rawText: string): AnalysisResult {
  const text = rawText.trim();

  if (!text) {
    throw new Error("Paste an announcement before analyzing.");
  }

  const lowerText = text.toLowerCase();
  const title =
    text
      .split(/[.!\n]/)
      .map((line) => line.trim())
      .find(
        (line) => line && /scholarship|announcement|competition|event|program|deadline|registration|call/i.test(line),
      ) || "Announcement Review";

  const summary = lowerText.includes("scholarship")
    ? "This announcement is a scholarship opportunity with a clear application deadline and document requirements. Applicants should prepare proof of enrollment, academic records, and a tailored statement of purpose."
    : lowerText.includes("competition")
      ? "This is a competitive opportunity with a defined deadline, eligibility requirements, and submission items. Focus on the required documents and the selection stages before submitting."
      : lowerText.includes("event")
        ? "This announcement describes an event or program with a scheduled date, participation requirements, and registration steps. Confirm attendance requirements and prepare the needed supporting materials."
        : "This announcement has a defined application flow, key dates, and required steps. Review the deadlines and eligibility details carefully before acting.";

  const extractDates = () => {
    const dateMatches =
      text.match(/\b(?:\d{1,2}\s+[A-Z][a-z]+(?:\s+\d{4})?|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})\b/g) || [];
    return Array.from(new Set(dateMatches)).slice(0, 5);
  };

  const dates = extractDates();
  const registrationDeadline =
    text.match(/(?:deadline|closing|closes|due|ends?)\s*(?:on|by)?\s*[:\-]?\s*([^\n.]+)/i)?.[1]?.trim() ||
    dates[0] ||
    "Not explicitly stated";

  const eligibilityRequirements = [
    lowerText.includes("gpa") || lowerText.includes("grade")
      ? "Maintain the minimum academic performance required by the source announcement."
      : "Meet the stated academic or institutional eligibility criteria.",
    lowerText.includes("student") || lowerText.includes("enrolled")
      ? "Be currently enrolled or otherwise active in the relevant university or program."
      : "Hold the qualifying status listed in the announcement.",
    lowerText.includes("final-year") || lowerText.includes("final year")
      ? "Check whether the announcement targets a specific academic level or cohort."
      : "Confirm your category, status, or cohort matches the stated requirement.",
  ];

  const requiredDocuments = [
    lowerText.includes("transcript") ? "Academic transcript or latest grades" : "Academic record or transcript",
    lowerText.includes("cv") || lowerText.includes("curriculum vitae") ? "Curriculum Vitae" : "Updated resume or CV",
    lowerText.includes("student id") || lowerText.includes("student card") ? "Student ID or proof of enrollment" : "Proof of enrollment or student identification",
    lowerText.includes("essay") ? "Statement or essay required by the announcement" : "Supporting statement or motivation letter",
  ];

  const requiredActions = [
    "Review the eligibility criteria before preparing your application.",
    "Prepare every required document and upload them in the required format.",
    "Submit the application before the final deadline and keep a saved copy of the confirmation.",
  ];

  const warnings = [
    lowerText.includes("late") || lowerText.includes("incomplete")
      ? "Late or incomplete submissions are not accepted."
      : "Confirm all details before applying, as incomplete files may be rejected.",
    lowerText.includes("interview") ? "The process may include interviews or further screening steps." : "Selection may include additional review or validation stages.",
  ];

  const missingInformation = [
    dates.length ? "Dates are available but may still require confirmation before acting." : "No exact dates were found in the source text.",
    lowerText.includes("website") || lowerText.includes("link") ? "The source link or official portal is present and should be checked before final submission." : "The announcement may need a direct official link or portal to confirm the final procedure.",
  ];

  const evidence = [
    { label: "Title cue", value: title },
    { label: "Deadline signal", value: registrationDeadline },
    { label: "Eligibility signal", value: lowerText.includes("gpa") ? "Academic requirements are listed in the source text." : "Eligibility criteria are included in the announcement." },
    { label: "Submission signal", value: lowerText.includes("upload") ? "Submission instructions are present and should be followed carefully." : "Submission flow is described in the announcement." },
  ];

  return {
    title,
    summary,
    importantDates: dates.length ? dates : ["No date mentioned in the announcement"],
    registrationDeadline,
    eventSchedule: [
      lowerText.includes("interview") ? "Interview or screening stage" : "Selection and review stage",
      lowerText.includes("essay") ? "Essay or statement review" : "Application review",
    ],
    eligibilityRequirements,
    requiredDocuments: Array.from(new Set(requiredDocuments)).slice(0, 4),
    requiredActions,
    warnings,
    missingInformation,
    sourceEvidence: evidence,
  };
}

export default function Home() {
  const [announcement, setAnnouncement] = useState(sampleAnnouncement);
  const [result, setResult] = useState<AnalysisResult>(() => parseAnnouncement(sampleAnnouncement));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = () => {
    setIsLoading(true);
    setError(null);

    window.setTimeout(() => {
      try {
        setResult(parseAnnouncement(announcement));
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
        setResult(emptyResult);
      } finally {
        setIsLoading(false);
      }
    }, 350);
  };

  const fillSample = () => {
    setAnnouncement(sampleAnnouncement);
    setResult(parseAnnouncement(sampleAnnouncement));
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-700">ClearNotice AI</p>
            <h1 className="text-xl font-semibold text-slate-900">Announcement intelligence workspace</h1>
          </div>

          <nav aria-label="Main navigation" className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#workspace" className="transition hover:text-slate-900">Workspace</a>
            <a href="#brief" className="transition hover:text-slate-900">Brief</a>
            <a href="#evidence" className="transition hover:text-slate-900">Evidence</a>
          </nav>
        </div>
      </header>

      <main id="workspace" className="mx-auto max-w-7xl px-6 py-8 sm:py-10">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_45px_rgba(15,23,42,0.06)] sm:p-7">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-500">Input</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Paste an announcement</h2>
              </div>
              <button
                type="button"
                onClick={fillSample}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                Load sample
              </button>
            </div>

            <label htmlFor="announcement-input" className="sr-only">
              Announcement text
            </label>
            <textarea
              id="announcement-input"
              value={announcement}
              onChange={(event) => setAnnouncement(event.target.value)}
              rows={13}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-800 shadow-inner outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              aria-label="Announcement text"
            />

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isLoading}
                className="inline-flex items-center justify-center rounded-full bg-[#0f172a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {isLoading ? "Analyzing announcement..." : "Analyze announcement"}
              </button>
              <button
                type="button"
                onClick={() => setAnnouncement("")}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                Clear
              </button>
            </div>

            {error ? (
              <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <aside className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-[0_18px_40px_rgba(16,185,129,0.12)] sm:p-7">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-emerald-700">Overview</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">{result.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">{result.summary}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-[0.65rem] uppercase tracking-[0.22em] text-slate-500">Registration deadline</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{result.registrationDeadline}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-[0.65rem] uppercase tracking-[0.22em] text-slate-500">Important dates</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {result.importantDates.map((date) => (
                    <li key={date}>• {date}</li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </section>

        <section id="brief" className="mt-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-500">Structured brief</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">What matters most</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-500">Eligibility</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                {result.eligibilityRequirements.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-500">Required documents</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                {result.requiredDocuments.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-500">Required actions</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                {result.requiredActions.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-500">Warnings</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                {result.warnings.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-500">Timeline</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">Event schedule</h3>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-700">
              {result.eventSchedule.map((item) => (
                <li key={item} className="flex gap-3 rounded-2xl bg-slate-50 px-3 py-2">
                  <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-500">Missing information</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">What still needs confirmation</h3>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
              {result.missingInformation.map((item) => (
                <li key={item} className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section id="evidence" className="mt-12 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-500">Source evidence</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">Grounded extraction</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {result.sourceEvidence.map((fact) => (
              <div key={fact.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500">{fact.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{fact.value}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
