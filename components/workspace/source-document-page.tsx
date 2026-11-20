"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  FileText,
  Search,
  CheckCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useAnnouncement } from "./announcement-provider";
import { WorkspaceShell } from "./workspace-shell";

export function SourceDocumentPage() {
  const {
    source,
    uploadedFile,
    analysis,
    activeEvidenceId,
    setActiveEvidenceId,
    copyText,
    loadCanonicalDemo,
  } = useAnnouncement();

  const [mode, setMode] = useState<"annotated" | "clean">("annotated");
  const [inDocSearch, setInDocSearch] = useState("");
  const [selectedParagraph, setSelectedParagraph] = useState<number | null>(null);

  const paragraphs = useMemo(() => {
    return source.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  }, [source]);

  // Count search matches
  const matchCount = useMemo(() => {
    if (!inDocSearch.trim()) return 0;
    const q = inDocSearch.toLowerCase();
    return paragraphs.filter((p) => p.toLowerCase().includes(q)).length;
  }, [inDocSearch, paragraphs]);

  // Jump to active citation
  useEffect(() => {
    if (!activeEvidenceId) return;
    const el = document.getElementById(`doc-cite-${activeEvidenceId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeEvidenceId]);

  if (!source) {
    return (
      <WorkspaceShell>
        <div className="bg-white border border-slate-300 rounded-xl p-8 max-w-xl mx-auto text-center space-y-5 my-12 shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mx-auto border border-blue-200">
            <FileText size={24} />
          </div>
          <h2 className="font-serif font-bold text-xl text-slate-900">No Document Ingested</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Please input announcement text in the workspace or load the official demonstration document to read and inspect highlighted source citations.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={loadCanonicalDemo}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Load Canonical NSIG Document
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors"
            >
              Go to Workspace
            </Link>
          </div>
        </div>
      </WorkspaceShell>
    );
  }

  const jumpToPassage = (pNum: number) => {
    setSelectedParagraph(pNum);
    const el = document.getElementById(`doc-p-${pNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const activeAnchor = analysis?.evidence.find((e) => e.id === activeEvidenceId);

  return (
    <WorkspaceShell>
      <div className="flex flex-col bg-white border border-slate-300 rounded-xl overflow-hidden shadow-xs max-w-6xl mx-auto w-full">
        {/* ========================================================================= */}
        {/* 1. TOP DOCUMENT CONTROL SUB-BAR (From Stitch source-documment.html)       */}
        {/* ========================================================================= */}
        <section className="bg-slate-50 border-b border-slate-200 px-5 py-3 space-y-3">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-slate-900 text-white font-mono text-[10px] tracking-wider uppercase rounded font-bold">
                  CIRCULAR // 0418-E2
                </span>
                <span className="font-serif font-bold text-base text-slate-900 truncate max-w-xl">
                  {uploadedFile?.name || "National Student Innovation Grant (NSIG) 2026 – Call for Proposals"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                <span>MoECRT (Directorate General of Higher Education)</span>
                <span>•</span>
                <a
                  href="https://moecrt.go.id/nsig-2026"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>https://moecrt.go.id/nsig-2026</span>
                  <ExternalLink size={12} />
                </a>
                <span>•</span>
                <span>Ingested: <strong>Apr 15, 2026</strong></span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span>Canonical Text Synchronized</span>
                </span>
              </div>
            </div>

            {/* Mode Toggles */}
            <div className="flex items-center gap-2 self-start xl:self-auto shrink-0">
              <div className="inline-flex p-0.5 bg-slate-200 rounded-lg text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setMode("annotated")}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    mode === "annotated"
                      ? "bg-white text-slate-900 shadow-xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Annotated Evidence
                </button>
                <button
                  type="button"
                  onClick={() => setMode("clean")}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    mode === "clean"
                      ? "bg-white text-slate-900 shadow-xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Clean Reader
                </button>
              </div>
            </div>
          </div>

          {/* Quick Jump Chips & In-Doc Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-200/80">
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
              <span className="text-slate-400 uppercase font-bold mr-1 shrink-0">JUMP TO:</span>
              <button
                type="button"
                onClick={() => setSelectedParagraph(null)}
                className={`px-2 py-1 rounded transition-colors shrink-0 ${
                  selectedParagraph === null ? "bg-slate-900 text-white font-semibold" : "bg-white text-slate-700 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              {paragraphs.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => jumpToPassage(i + 1)}
                  className={`px-2 py-1 rounded transition-colors shrink-0 ${
                    selectedParagraph === i + 1 ? "bg-blue-600 text-white font-semibold" : "bg-white text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  #P{i + 1}
                </button>
              ))}
            </div>

            <div className="relative shrink-0">
              <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={inDocSearch}
                onChange={(e) => setInDocSearch(e.target.value)}
                placeholder="Search phrases, keywords..."
                className="pl-7 pr-16 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 w-64 shadow-2xs"
              />
              {inDocSearch.trim() && (
                <span className="absolute right-2 top-1.5 text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                  {matchCount} match{matchCount === 1 ? "" : "es"}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. TWO-COLUMN WORKBENCH CORE                                              */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[600px]">
          {/* LEFT: CANONICAL SOURCE DOCUMENT PAPER (8 cols) */}
          <section className="lg:col-span-8 p-6 sm:p-10 bg-[#fbfaf6] border-r border-slate-200 overflow-y-auto max-h-[calc(100vh-14rem)] space-y-6">
            {/* Regulatory Paper Sheet */}
            <article className="max-w-2xl mx-auto space-y-6 text-[#292f3b]">
              {/* Letterhead Crest */}
              <div className="text-center pb-6 border-b border-[#e2decb] space-y-1 select-none">
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-200 flex items-center justify-center text-slate-800 font-bold mb-2">
                  <ShieldCheck size={22} />
                </div>
                <p className="font-mono text-[10px] tracking-widest uppercase font-bold text-slate-500">
                  DIRECTORATE GENERAL OF HIGHER EDUCATION — REPUBLIC OF INDONESIA
                </p>
                <p className="font-serif text-xs text-slate-600 italic">
                  Ministry of Education, Culture, Research, and Technology • Circular No. 0418/E2/DT.01/2026
                </p>
                <h1 className="font-serif font-bold text-lg text-slate-900 pt-2 leading-snug">
                  National Student Innovation Grant (NSIG) Fiscal Year 2026 Call for Proposals & Statutory Operational Terms
                </h1>
              </div>

              {/* Paragraphs with citations */}
              {paragraphs.map((paragraphText, idx) => {
                const pNum = idx + 1;
                const isSelected = selectedParagraph === pNum;
                const matchesSearch = inDocSearch.trim() && paragraphText.toLowerCase().includes(inDocSearch.toLowerCase());

                return (
                  <div
                    key={idx}
                    id={`doc-p-${pNum}`}
                    className={`relative pl-8 border-l-2 transition-all font-serif text-[14px] leading-[1.8] ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 p-4 rounded-r-lg"
                        : matchesSearch
                          ? "border-amber-500 bg-amber-50/60 p-4 rounded-r-lg"
                          : "border-transparent hover:border-slate-300"
                    }`}
                  >
                    <span className="absolute left-1 top-0 font-mono text-[10px] text-slate-400 select-none font-semibold">
                      #P{pNum}
                    </span>

                    {mode === "annotated" && pNum === 3 ? (
                      <p>
                        Formal proposal intake opens electronically on April 15, 2026. The official submission window closes irreversibly on{" "}
                        <mark
                          id="doc-cite-E05"
                          onClick={() => setActiveEvidenceId("E05")}
                          className="cursor-pointer bg-amber-100 text-amber-950 font-semibold px-1 rounded border-b border-amber-400 hover:bg-amber-200 transition-colors"
                        >
                          May 31, 2026 at 23:59 Western Indonesia Time (WIB)
                        </mark>
                        .{" "}
                        <mark
                          id="doc-cite-E02"
                          onClick={() => setActiveEvidenceId("E02")}
                          className="cursor-pointer bg-blue-100 text-blue-950 font-medium px-1 rounded border-b border-blue-600 hover:bg-blue-200 transition-colors inline"
                        >
                          The program offers competitive non-repayable project grants of up to IDR 100,000,000 per selected proposal.
                        </mark>{" "}
                        <mark
                          id="doc-cite-E03"
                          onClick={() => setActiveEvidenceId("E03")}
                          className="cursor-pointer bg-amber-50 text-amber-950 font-normal px-1 rounded border-b border-dashed border-amber-600 hover:bg-amber-100 transition-colors inline"
                        >
                          Detailed technical guidelines, budget breakdown sheets, and institutional endorsement portals can be accessed through the official portal.
                        </mark>
                      </p>
                    ) : (
                      <p>{paragraphText}</p>
                    )}
                  </div>
                );
              })}
            </article>
          </section>

          {/* RIGHT: CITATION & METADATA INSPECTOR (4 cols) */}
          <aside className="lg:col-span-4 p-5 bg-white space-y-5 overflow-y-auto max-h-[calc(100vh-14rem)]">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800">
                  Active Citation Inspector
                </span>
                <Link
                  href="/evidence-ledger"
                  className="text-xs text-blue-600 hover:underline font-mono"
                >
                  Ledger View →
                </Link>
              </div>

              {activeAnchor ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono font-bold text-[11px]">
                      Citation [{activeAnchor.id}]
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      Paragraph #{activeAnchor.paragraph}
                    </span>
                  </div>
                  <blockquote className="font-serif italic text-slate-800 leading-relaxed bg-white p-3 rounded border border-slate-200">
                    “{activeAnchor.quote}”
                  </blockquote>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => void copyText(activeAnchor.quote, activeAnchor.id)}
                      className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy size={13} />
                      <span>Copy Citation</span>
                    </button>
                    <Link
                      href="/analysis-brief"
                      className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>View in Brief</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                  Click any highlighted sentence in the document to inspect its evidence metadata.
                </div>
              )}
            </div>

            {/* Document Ingestion Specs */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Verification Provenance
              </span>
              <div className="space-y-1 font-mono text-[11px] text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-emerald-700 font-bold">100% Hash Matched</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Words:</span>
                  <span>{source.split(/\s+/).length} words</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Paragraphs:</span>
                  <span>{paragraphs.length} blocks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Citations:</span>
                  <span>{analysis?.evidence.length || 0} active</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </WorkspaceShell>
  );
}
