"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { EvidenceStatus, Finding } from "./types";
import { useAnnouncement } from "./announcement-provider";
import { getEvidenceStatus } from "./evidence-status";

type LedgerFilter = EvidenceStatus | "all";

const statusLabel: Record<EvidenceStatus, string> = {
  supported: "Text match",
  "needs-verification": "Needs review",
  unknown: "No source match",
};

const statusClass: Record<EvidenceStatus, string> = {
  supported: "border-emerald-300 bg-emerald-50 text-emerald-950",
  "needs-verification": "border-amber-300 bg-amber-50 text-amber-950",
  unknown: "border-slate-300 bg-slate-100 text-slate-800",
};

export function EvidenceLedgerPage() {
  const router = useRouter();
  const {
    analysis,
    isDemo,
    isLoading,
    error,
    activeEvidenceId,
    copyMessage,
    setActiveEvidenceId,
    copyText,
  } = useAnnouncement();
  const [filter, setFilter] = useState<LedgerFilter>("all");
  const [query, setQuery] = useState("");
  const entries = useMemo(() => {
    if (!analysis) return [];

    const findings: Finding[] = [
      analysis.announcementType,
      ...analysis.importantDates,
      ...analysis.eligibility,
      ...analysis.requirements,
      ...analysis.costsAndFees,
      ...analysis.actionItems,
      ...analysis.warnings,
    ];

    const linkedEntries = analysis.evidence.map((anchor) => {
      const relatedFindings = findings.filter((item) => item.evidenceId === anchor.id);
      const finding = relatedFindings[0];
      return {
        id: anchor.id,
        status: getEvidenceStatus(analysis, anchor.id),
        label: finding?.label ?? "Source passage",
        detail: finding?.detail ?? "Referenced source passage.",
        quote: anchor.quote,
        paragraph: anchor.paragraph,
      };
    });

    const unknownEntries = analysis.unknowns.map((finding) => ({
      id: finding.id,
      status: "unknown" as const,
      label: finding.label,
      detail: finding.detail,
      quote: null,
      paragraph: null,
    }));

    return [...linkedEntries, ...unknownEntries];
  }, [analysis]);
  const recordRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!activeEvidenceId) return;
    recordRefs.current[activeEvidenceId]?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center",
    });
  }, [activeEvidenceId, entries.length]);

  const filteredEntries = entries.filter((entry) => {
    const matchesStatus = filter === "all" || entry.status === filter;
    const searchableText = `${entry.label} ${entry.detail} ${entry.quote ?? ""}`.toLowerCase();
    return matchesStatus && searchableText.includes(query.trim().toLowerCase());
  });

  if (!analysis) {
    return (
      <div className="space-y-4">
        {isLoading ? (
          <p className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800" role="status">
            Preparing source matches...
          </p>
        ) : null}
        {error ? (
          <p className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900" role="alert">
            {error}
          </p>
        ) : null}
        {!isLoading ? (
          <section className="rounded-xl border border-slate-300 bg-white p-5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
              Evidence ledger
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">No evidence to review</h2>
            <p className="mt-3 max-w-prose text-sm leading-6 text-slate-700">
              Prepare a brief from announcement text before reviewing its source passages.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              Go to workspace
            </button>
          </section>
        ) : null}
      </div>
    );
  }

  const locateSource = (id: string) => {
    setActiveEvidenceId(id);
    router.push("/source-document");
  };

  const filters: { value: LedgerFilter; label: string }[] = [
    { value: "all", label: "All items" },
    { value: "supported", label: "Text matches" },
    { value: "needs-verification", label: "Needs review" },
    { value: "unknown", label: "Unknown" },
  ];
  const counts = {
    all: entries.length,
    supported: entries.filter((entry) => entry.status === "supported").length,
    "needs-verification": entries.filter((entry) => entry.status === "needs-verification").length,
    unknown: entries.filter((entry) => entry.status === "unknown").length,
  };

  return (
    <div className="space-y-5">
      {isLoading ? (
        <p className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800" role="status">
          Preparing source matches...
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900" role="alert">
          {error}
        </p>
      ) : null}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-blue-800">
            {isDemo ? "Fictional demo dataset" : "Current announcement"}
          </p>
          <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Evidence ledger
          </h2>
          <p className="mt-2 max-w-prose text-sm leading-6 text-slate-700">
            A text match confirms where a phrase appears in this input. It does not verify the notice independently.
          </p>
        </div>
        <label className="w-full text-sm font-medium text-slate-800 sm:max-w-xs">
          Search claims and passages
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            className="mt-1 min-h-11 w-full rounded border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            placeholder="Search this analysis"
          />
        </label>
      </header>

      <div className="flex flex-wrap gap-2 border-y border-slate-300 py-3" aria-label="Filter evidence entries">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={filter === item.value}
            onClick={() => setFilter(item.value)}
            className={`inline-flex min-h-11 items-center gap-2 rounded border px-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
              filter === item.value
                ? "border-[#0b1120] bg-[#0b1120] text-white"
                : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
            }`}
          >
            {item.label}
            <span className={`font-mono text-xs ${filter === item.value ? "text-slate-200" : "text-slate-600"}`}>
              {counts[item.value]}
            </span>
          </button>
        ))}
      </div>

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(16rem,0.8fr)]">
        <div className="min-w-0">
          {filteredEntries.length ? (
            <ol className="space-y-3">
              {filteredEntries.map((entry) => (
                <li
                  key={entry.id}
                  ref={(element) => {
                    recordRefs.current[entry.id] = element;
                  }}
                  className={`overflow-hidden border bg-white transition-colors ${
                    activeEvidenceId === entry.id
                      ? "border-blue-700 ring-2 ring-blue-700/20"
                      : "border-slate-300"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-[#f4f2ea] px-4 py-3">
                    <p className="font-mono text-xs font-semibold text-slate-800">
                      {entry.id}
                      {entry.paragraph ? ` · Paragraph ${entry.paragraph}` : ""}
                    </p>
                    <span className={`inline-flex min-h-7 items-center rounded border px-2 py-1 text-xs font-semibold ${statusClass[entry.status]}`}>
                      {statusLabel[entry.status]}
                    </span>
                  </div>
                  <div className="grid min-w-0 gap-3 p-4 md:grid-cols-2 sm:p-5">
                    <section className="min-w-0 border border-slate-200 bg-white p-3" aria-label="Finding">
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                        Candidate finding
                      </p>
                      <h3 className="mt-2 text-sm font-semibold text-slate-950">{entry.label}</h3>
                      <p className="mt-2 break-words text-sm leading-6 text-slate-800">{entry.detail}</p>
                    </section>
                    <section className="min-w-0 border border-[#dfdcce] bg-[#fbfaf6] p-3" aria-label="Source passage">
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                        Source passage
                      </p>
                      {entry.quote ? (
                        <blockquote className="mt-2 break-words border-l-2 border-blue-700 pl-3 font-serif text-sm leading-6 text-slate-800">
                          {entry.quote}
                        </blockquote>
                      ) : (
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          No matching source passage was identified by the local rules.
                        </p>
                      )}
                    </section>
                  </div>
                  {entry.quote ? (
                    <div className="flex flex-wrap gap-2 border-t border-slate-200 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => locateSource(entry.id)}
                        className="inline-flex min-h-11 items-center justify-center rounded border border-blue-800 bg-blue-800 px-3 text-sm font-semibold text-white hover:bg-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                      >
                        View in source
                      </button>
                      <button
                        type="button"
                        onClick={() => void copyText(entry.quote ?? "", entry.id)}
                        className="inline-flex min-h-11 items-center justify-center rounded border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                      >
                        Copy citation
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="border border-slate-300 bg-white p-5 text-sm leading-6 text-slate-700" role="status">
              No evidence entries match this filter and search.
            </p>
          )}
        </div>

        <aside className="space-y-4">
          <section className="border border-slate-300 bg-white p-4">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wide text-slate-700">
              Current analysis
            </h3>
            <dl className="mt-3 divide-y divide-slate-200 border-y border-slate-200 text-sm">
              <div className="flex items-center justify-between gap-3 py-2">
                <dt className="text-slate-700">Text matches</dt>
                <dd className="font-mono font-semibold text-emerald-900">{counts.supported}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2">
                <dt className="text-slate-700">Needs review</dt>
                <dd className="font-mono font-semibold text-amber-900">{counts["needs-verification"]}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2">
                <dt className="text-slate-700">Unknown</dt>
                <dd className="font-mono font-semibold text-slate-800">{counts.unknown}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs leading-5 text-slate-600">
              Counts reflect this in-memory prototype analysis only. They are not a saved audit record.
            </p>
          </section>

          <section className="border border-slate-700 bg-[#0b1120] p-4 text-slate-100">
            <h3 className="font-serif text-lg font-semibold">How to read a match</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Text match means the quoted text appears in the input. Needs review marks an ambiguous match. Unknown means these local rules found no source passage.
            </p>
            <Link
              href="/analysis-brief"
              className="mt-4 inline-flex min-h-11 items-center rounded border border-slate-600 px-3 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
            >
              Return to the brief
            </Link>
          </section>
        </aside>
      </div>
      {copyMessage ? <p className="text-sm text-slate-700" role="status">{copyMessage}</p> : null}
    </div>
  );
}
