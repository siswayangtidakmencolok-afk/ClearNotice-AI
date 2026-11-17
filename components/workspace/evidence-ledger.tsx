"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { EvidenceStatus, Finding } from "./types";
import { useAnnouncement } from "./announcement-provider";

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
        status: relatedFindings.some((item) => item.status === "needs-verification")
          ? "needs-verification"
          : anchor.status,
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
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
            {isDemo ? "Fictional demo dataset" : "Current announcement"}
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
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
            className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            placeholder="Search this analysis"
          />
        </label>
      </header>

      <div className="flex flex-wrap gap-2" aria-label="Filter evidence entries">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={filter === item.value}
            onClick={() => setFilter(item.value)}
            className={`inline-flex min-h-11 items-center rounded-md border px-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
              filter === item.value
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filteredEntries.length ? (
        <ol className="space-y-3">
          {filteredEntries.map((entry) => (
            <li
              key={entry.id}
              ref={(element) => {
                recordRefs.current[entry.id] = element;
              }}
              className={`rounded-lg border bg-white p-4 transition-colors sm:p-5 ${
                activeEvidenceId === entry.id ? "border-emerald-700 ring-2 ring-emerald-700/20" : "border-slate-300"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-xs font-semibold text-slate-800">
                  {entry.id}
                  {entry.paragraph ? ` · Paragraph ${entry.paragraph}` : ""}
                </p>
                <span className={`inline-flex min-h-7 items-center rounded-md border px-2 py-1 text-xs font-semibold ${statusClass[entry.status]}`}>
                  {statusLabel[entry.status]}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-950">{entry.label}</h3>
              <p className="mt-2 break-words text-sm leading-6 text-slate-800">{entry.detail}</p>
              {entry.quote ? (
                <blockquote className="mt-3 break-words border-l-2 border-emerald-700 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-800">
                  {entry.quote}
                </blockquote>
              ) : (
                <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  No matching source passage was identified by the local rules.
                </p>
              )}
              {entry.quote ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => locateSource(entry.id)}
                    className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                  >
                    View in source
                  </button>
                  <button
                    type="button"
                    onClick={() => void copyText(entry.quote ?? "", entry.id)}
                    className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                  >
                    Copy citation
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-lg border border-slate-300 bg-white p-5 text-sm leading-6 text-slate-700" role="status">
          No evidence entries match this filter and search.
        </p>
      )}
      {copyMessage ? <p className="text-sm text-slate-700" role="status">{copyMessage}</p> : null}
    </div>
  );
}
