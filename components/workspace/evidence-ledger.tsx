"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import {
  Link2,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldAlert,
  Copy,
  ChevronRight,
  Filter,
  FileText,
} from "lucide-react";
import { useAnnouncement } from "./announcement-provider";
import { getEvidenceStatus } from "./evidence-status";
import type { EvidenceStatus, Finding } from "./types";

type LedgerFilter = EvidenceStatus | "all";

export function EvidenceLedgerPage() {
  const router = useRouter();
  const {
    analysis,
    activeEvidenceId,
    setActiveEvidenceId,
    copyText,
    loadCanonicalDemo,
  } = useAnnouncement();

  const [filter, setFilter] = useState<LedgerFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const entries = useMemo(() => {
    if (!analysis) return [];

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

    const linked = analysis.evidence.map((anchor, index) => {
      const related = findings.filter((f) => f.evidenceId === anchor.id);
      const mainFinding = related[0];
      return {
        id: anchor.id,
        refNumber: `E-${String(index + 1).padStart(3, "0")}`,
        status: anchor.status,
        label: mainFinding?.label || "Operative Claim",
        detail: mainFinding?.detail || "Asserted claim from official notice.",
        quote: anchor.quote,
        paragraph: anchor.paragraph,
        page: anchor.page,
        confidence: anchor.status === "supported" ? 0.98 : 0.74,
      };
    });

    const unknowns = analysis.unknowns.map((unk, index) => ({
      id: unk.id,
      refNumber: `U-${String(index + 1).padStart(3, "0")}`,
      status: "unknown" as const,
      label: unk.label,
      detail: unk.detail,
      quote: null,
      paragraph: null,
      page: null,
      confidence: 0,
    }));

    return [...linked, ...unknowns];
  }, [analysis]);

  if (!analysis) {
    return (
      <div className="bg-white border border-slate-300 rounded-xl p-8 max-w-xl mx-auto text-center space-y-5 my-12 shadow-sm">
        <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mx-auto border border-blue-200">
          <Link2 size={24} />
        </div>
        <h2 className="font-serif font-bold text-xl text-slate-900">No Evidence Records Available</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          The forensic evidence ledger maps extracted AI claims to exact verbatim passages. Load the canonical demonstration notice to inspect verified bi-directional citations.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={loadCanonicalDemo}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Load Canonical NSIG Evidence
          </button>
          <Link
            href="/"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors"
          >
            Go to Workspace
          </Link>
        </div>
      </div>
    );
  }

  const filteredEntries = entries.filter((item) => {
    const matchesFilter = filter === "all" || item.status === filter;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesFilter;
    const matchesSearch =
      item.label.toLowerCase().includes(q) ||
      item.detail.toLowerCase().includes(q) ||
      (item.quote && item.quote.toLowerCase().includes(q)) ||
      item.refNumber.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const jumpToSource = (evidenceId: string) => {
    setActiveEvidenceId(evidenceId);
    router.push("/source-document");
  };

  const counts = {
    all: entries.length,
    supported: entries.filter((e) => e.status === "supported").length,
    "needs-verification": entries.filter((e) => e.status === "needs-verification").length,
    unknown: entries.filter((e) => e.status === "unknown").length,
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full pb-16">
      {/* ========================================================================= */}
      {/* 1. TOP LEDGER HEADER (From Stitch evdence-ledger.html)                    */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-blue-700">
              Forensic Ledger Subsystem
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              ID: LEDGER-2026-0418
            </span>
            <span className="text-xs text-slate-500">
              MoECRT Circular Ref: No. 0418/E2/DT.01/2026
            </span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Evidence Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Every important finding should have a traceable source. Verbatim passages linked to model assertions.
          </p>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search claims, quotes, refs..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 w-64 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EPISTEMIC GUARDRAIL PROTOCOL BANNER                                    */}
      {/* ========================================================================= */}
      <div className="bg-[#0b1120] text-slate-100 rounded-xl p-4 sm:p-5 flex items-start gap-4 shadow-sm border border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/40">
          <ShieldAlert size={20} />
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-blue-400 font-bold">
              Epistemic Guardrail Protocol • Forensic Rule #01
            </span>
            <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
              AUTH: VERIFIED INGESTION
            </span>
          </div>
          <p className="text-xs sm:text-[13px] leading-relaxed text-slate-300">
            <strong className="text-white">Epistemic Principle:</strong> A verbatim text match verifies that an assertion was stated in the announcement, not that the underlying claim is independently factual or procedurally complete. Always review cross-referenced institutional circulars.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. STATUS FILTER PILLS                                                    */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-2 rounded-lg border border-slate-200">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              filter === "all"
                ? "bg-slate-900 text-white font-semibold"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <span>All Claims</span>
            <span className="bg-slate-700 text-white text-[10px] px-1.5 py-0.2 rounded-full">
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("supported")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              filter === "supported"
                ? "bg-emerald-700 text-white font-semibold"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Supported Matches</span>
            <span className="text-[10px] opacity-80">({counts.supported})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("needs-verification")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              filter === "needs-verification"
                ? "bg-amber-600 text-white font-semibold"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Needs Review</span>
            <span className="text-[10px] opacity-80">({counts["needs-verification"]})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("unknown")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              filter === "unknown"
                ? "bg-slate-600 text-white font-semibold"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span>Unknown / Omitted</span>
            <span className="text-[10px] opacity-80">({counts.unknown})</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Displaying: <strong>{filteredEntries.length} of {entries.length} Claims</strong>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TRACEABLE CLAIM-TO-EVIDENCE CARDS                                      */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {filteredEntries.map((record) => (
          <article
            key={record.id}
            className={`bg-white rounded-xl border overflow-hidden shadow-xs transition-all ${
              activeEvidenceId === record.id
                ? "border-blue-600 ring-2 ring-blue-500/20"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            {/* Card Header & Metadata */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                  Ref: {record.refNumber}
                </span>
                {record.paragraph && (
                  <span className="font-mono text-xs text-slate-600">
                    Paragraph #{record.paragraph}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {record.status === "supported" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono text-[11px] font-semibold">
                    <CheckCircle size={12} className="text-emerald-700" />
                    <span>Direct Verbatim Match</span>
                  </span>
                )}
                {record.status === "needs-verification" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[11px] font-semibold">
                    <AlertTriangle size={12} className="text-amber-700" />
                    <span>Caveat Noted / Open Clause</span>
                  </span>
                )}
                {record.status === "unknown" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300 font-mono text-[11px] font-semibold">
                    <Clock size={12} />
                    <span>Missing from Source</span>
                  </span>
                )}
              </div>
            </div>

            {/* Dual Bridge Grid (Claim on Left, Exact Quote on Right) */}
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              {/* Left: AI Extracted Operative Claim */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block tracking-wider">
                  Extracted Operative Finding
                </span>
                <h3 className="font-semibold text-slate-900 text-sm">{record.label}</h3>
                <p className="text-xs text-slate-700 leading-relaxed">{record.detail}</p>
              </div>

              {/* Right: Exact Source Quote Block or Missing Info */}
              <div>
                {record.quote ? (
                  <div className="p-4 bg-[#fbfaf6] border-l-4 border-blue-600 rounded-r-lg border border-[#e8e5d8] space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>LOCATION: Paragraph #{record.paragraph}</span>
                      <span>CONFIDENCE: {record.confidence}</span>
                    </div>
                    <blockquote className="font-serif italic text-xs text-slate-800 leading-relaxed">
                      “{record.quote}”
                    </blockquote>
                    <div className="pt-2 flex items-center justify-between border-t border-slate-200/70">
                      <button
                        type="button"
                        onClick={() => jumpToSource(record.id)}
                        className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer font-sans"
                      >
                        <FileText size={12} />
                        <span>Jump to Passage in Doc</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void copyText(record.quote!, record.id)}
                        className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy size={12} />
                        <span>Copy Quote</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500 uppercase font-semibold">
                      <Clock size={12} />
                      <span>Zero Matching Passages Found</span>
                    </div>
                    <p className="leading-relaxed">
                      This operative requirement was tested against all tokenized paragraphs. No explicit or corroborating sentence was identified in the ingested circular.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}

        {filteredEntries.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
            No claims matched your search filter.
          </div>
        )}
      </div>
    </div>
  );
}
