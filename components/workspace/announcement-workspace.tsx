"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  Upload,
  Copy,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Search,
  ChevronRight,
  Link2,
} from "lucide-react";
import { useAnnouncement } from "./announcement-provider";
import { EvidenceAuditDialog } from "./evidence-audit-dialog";
import { WorkspaceShell } from "./workspace-shell";
import { LiveDossier } from "./live-dossier";
import type { EvidenceAnchor } from "./types";

/** Wraps each evidence quote found in a paragraph in a clickable <mark> anchored as doc-cite-<id>. */
function HighlightedParagraph({ text, anchors, activeEvidenceId, onSelect }: { text: string; anchors: EvidenceAnchor[]; activeEvidenceId: string | null; onSelect: (id: string) => void }) {
  const spans = anchors
    .map((anchor) => ({ anchor, start: text.indexOf(anchor.quote) }))
    .filter((span) => span.start >= 0)
    .sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const { anchor, start } of spans) {
    if (start < cursor) continue;
    if (start > cursor) parts.push(text.slice(cursor, start));
    const verified = anchor.status === "supported";
    parts.push(
      <mark
        key={anchor.id}
        id={`doc-cite-${anchor.id}`}
        onClick={() => onSelect(anchor.id)}
        className={`cursor-pointer px-1 rounded transition-colors ${verified ? "bg-blue-100/90 text-blue-950 border-b-2 border-blue-600 hover:bg-blue-200" : "bg-amber-50 text-amber-950 border-b border-dashed border-amber-600 hover:bg-amber-100"} ${activeEvidenceId === anchor.id ? "ring-2 ring-blue-500/40" : ""}`}
      >
        {anchor.quote}
      </mark>,
    );
    cursor = start + anchor.quote.length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <p>{parts}</p>;
}

export function AnnouncementWorkspace() {
  const {
    source,
    uploadedFile,
    isDemo,
    analysis,
    isLoading,
    isExtracting,
    error,
    activeEvidenceId,
    copyMessage,
    changeSource,
    loadCanonicalDemo,
    startNewInvestigation,
    prepareBrief,
    uploadDocument,
    setActiveEvidenceId,
    copyText,
  } = useAnnouncement();

  const [auditOpen, setAuditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "evidence" | "dossier">("all");
  const [fileHover, setFileHover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);

  // Jump to highlighted paragraph when activeEvidenceId changes
  useEffect(() => {
    if (!activeEvidenceId) return;
    const el = document.getElementById(`doc-cite-${activeEvidenceId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeEvidenceId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void uploadDocument(file);
    }
  };

  const providerBadge = () => {
    if (analysis?.provider === "gemini") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 font-mono text-[11px] font-semibold">
          <Sparkles size={12} className="text-blue-700" />
          <span>Google Gemini ({analysis.modelId || "gemini-3.8-flash"})</span>
        </span>
      );
    }
    if (analysis?.provider === "openrouter") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[11px] font-semibold">
          <span>OpenRouter Fallback ({analysis.modelId || "openrouter/free"})</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300 font-mono text-[11px] font-semibold">
        <span>Verified Canonical Simulation</span>
      </span>
    );
  };

  return (
    <WorkspaceShell>
      <div className="flex flex-col h-[calc(100vh-6.5rem)] min-h-[700px] bg-white border border-slate-300 rounded-xl overflow-hidden shadow-xs">
        {/* ========================================================================= */}
        {/* 1. TOP INVESTIGATION TOOLSTRIP                                            */}
        {/* ========================================================================= */}
        <div className="bg-[#0b1120] text-slate-200 px-4 py-2.5 flex items-center justify-between border-b border-slate-800 flex-shrink-0 text-xs font-mono">
          <div className="flex items-center gap-3 overflow-x-auto">
            <div className="flex items-center gap-1.5 text-slate-200">
              <FileText size={14} className="text-blue-400 shrink-0" />
              <span className="font-bold text-white tracking-normal truncate max-w-[260px]">
                {uploadedFile?.name || (isDemo ? "NSIG_2026_Announcement_Official_MoECRT.pdf" : "Pasted announcement")}
              </span>
            </div>
            {isDemo && (
              <>
                <span className="text-slate-600 hidden md:inline">|</span>
                <div className="hidden md:inline text-slate-400">
                  SHA-256: <span className="text-slate-300">8f0b1a45...c712e9b0</span>
                </div>
                <span className="text-slate-600 hidden lg:inline">|</span>
                <div className="hidden lg:inline text-slate-400">
                  Ingested: <span className="text-slate-300">2026-04-15 09:30 WIB</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {analysis && (
              <button
                type="button"
                onClick={() => setAuditOpen(true)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShieldCheck size={13} className="text-emerald-400" />
                <span className="hidden sm:inline">Audit Trail</span>
              </button>
            )}
            <button
              type="button"
              onClick={startNewInvestigation}
              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>+ New Notice</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. MAIN WORKSPACE VIEWPORT                                                */}
        {/* ========================================================================= */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* STATE: PROCESSING PIPELINE */}
          {isLoading && (
            <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-xs flex items-center justify-center p-6">
              <div className="bg-white border border-slate-300 rounded-xl p-8 max-w-lg w-full text-center space-y-5 shadow-lg">
                <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mx-auto border border-blue-200 animate-spin">
                  <RotateCcw size={24} />
                </div>
                <div className="space-y-1">
                  <h2 className="font-serif font-bold text-xl text-slate-900">
                    Executing Multi-Provider Verification...
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    Calibrating evidence quotations against source text
                  </p>
                </div>
                <div className="space-y-2 text-left text-xs font-mono">
                  <div className="p-2.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded flex items-center justify-between">
                    <span>[1/3] Character Normalization & Ingestion</span>
                    <span className="font-bold">COMPLETE</span>
                  </div>
                  <div className="p-2.5 bg-blue-50 text-blue-900 border border-blue-200 rounded flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                      <span>[2/3] AI Reasoning & Extraction</span>
                    </span>
                    <span className="font-bold">IN PROGRESS</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 text-slate-400 border border-slate-200 rounded flex items-center justify-between">
                    <span>[3/3] Bi-Directional Citation Mapping</span>
                    <span>QUEUED</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STATE: EMPTY / INGEST INPUT */}
          {!analysis || !source.trim() ? (
            <div className="w-full h-full overflow-y-auto p-6 md:p-10 flex items-center justify-center bg-[#f7f9fb]">
              <div className="bg-white border border-slate-300 rounded-xl p-6 sm:p-8 max-w-2xl w-full text-center space-y-6 shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mx-auto border border-blue-200">
                  <FileText size={24} />
                </div>
                <div className="space-y-1">
                  <h2 className="font-serif font-bold text-2xl text-slate-900">
                    Ingest New Announcement Corpus
                  </h2>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Paste an official decree, scholarship notice, or upload a PDF/DOCX to generate a verified, evidence-linked decision dossier.
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-left text-xs text-rose-900 flex items-start gap-2">
                    <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Analysis Notice</p>
                      <p>{error}</p>
                    </div>
                  </div>
                )}

                {/* Textarea Input */}
                <div className="text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-mono text-xs text-slate-700 uppercase font-semibold">
                      Raw Announcement Text / Circular
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {source.length} / 120,000 chars
                    </span>
                  </div>
                  <textarea
                    value={source}
                    onChange={(e) => changeSource(e.target.value)}
                    rows={8}
                    placeholder="Paste full announcement or legal decree text here for evidence anchoring and claim extraction..."
                    className="w-full text-xs font-mono p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all leading-relaxed"
                  />
                </div>

                {/* Upload or Load Canonical Preset */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".pdf,.docx,.txt"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload size={14} />
                      <span>{isExtracting ? "Extracting..." : "Upload Document"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={loadCanonicalDemo}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Load NSIG 2026 Sample
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => void prepareBrief()}
                    disabled={!source.trim() || isLoading}
                    className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Run Verification Pipeline</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* STATE: ACTIVE INVESTIGATION MODE (DUAL PANE) */
            <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden">
              {/* ===================================================================== */}
              {/* LEFT PANE: CANONICAL SOURCE DOCUMENT READER (~48% width)              */}
              {/* ===================================================================== */}
              <section
                ref={sourceRef}
                className="w-full lg:w-[48%] border-r border-[#dcdad0] bg-[#f9f8f4] flex flex-col h-full flex-shrink-0 select-text overflow-hidden"
              >
                {/* Document Meta Header */}
                <div className="p-4 bg-[#f4f2ea] border-b border-[#dfdcce] flex-shrink-0 space-y-2 select-none">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span>Canonical Ingested Source Document</span>
                    </span>
                    {isDemo && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold">
                        SHA-256 Verified
                      </span>
                    )}
                  </div>
                  <h1 className="font-serif font-bold text-base text-slate-900 leading-snug">
                    {analysis?.overview?.subject || (isDemo ? "National Student Innovation Grant (NSIG) 2026" : uploadedFile?.name || "Announcement")}
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-serif italic flex-wrap">
                    <span>Authority: {analysis?.overview?.organizer?.detail || (isDemo ? "MoECRT Indonesia" : "Not stated in the source.")}</span>
                    {isDemo && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-[11px] not-italic text-slate-500">
                          DocID: ID-MOECRT-2026-NSIG-01
                        </span>
                      </>
                    )}
                  </div>

                  {/* Document Jump Pills */}
                  <div className="pt-2 border-t border-[#e5e2d4] flex items-center gap-1.5 text-[11px] font-mono overflow-x-auto text-slate-600">
                    <span className="text-slate-400 mr-1 text-[10px] uppercase font-bold shrink-0">
                      Jump:
                    </span>
                    <a
                      href="#doc-para-1"
                      className="px-2 py-0.5 rounded hover:bg-white hover:text-slate-900 transition-colors shrink-0"
                    >
                      #P1 Intro
                    </a>
                    <a
                      href="#doc-para-2"
                      className="px-2 py-0.5 rounded hover:bg-white hover:text-slate-900 transition-colors shrink-0"
                    >
                      #P2 Eligibility
                    </a>
                    <a
                      href="#doc-para-3"
                      className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-semibold hover:bg-blue-200 transition-colors shrink-0"
                    >
                      #P3 Capital & Deadlines
                    </a>
                    <a
                      href="#doc-para-4"
                      className="px-2 py-0.5 rounded hover:bg-rose-100 hover:text-rose-900 transition-colors shrink-0"
                    >
                      #P4 Penalties
                    </a>
                  </div>
                </div>

                {/* Document Body Reader (Warm Paper Editorial Feel) */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 font-serif text-[14px] leading-[1.8] text-[#292f3b] bg-[#fbfaf6]">
                  {/* Circular Notice Stamp */}
                  {isDemo && (
                    <div className="border-y border-[#e3dfd0] py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-500 select-none">
                      <span>DIRECTORATE GENERAL OF HIGHER EDUCATION</span>
                      <span>CIRCULAR NO. 0418/E2/DT.01/2026</span>
                    </div>
                  )}

                  {/* Render Paragraphs with anchors */}
                  {/* Same paragraph numbering as the server-side evidence mapping (empty blocks dropped). */}
                  {source.split(/\n\s*\n/).map((para) => para.trim()).filter(Boolean).map((para, idx) => {
                    const pNum = idx + 1;
                    // The annotated paragraph 3 below is hand-written demo content; real documents render their own text.
                    const isPara3 = isDemo && pNum === 3;
                    return (
                      <div
                        key={idx}
                        id={`doc-para-${pNum}`}
                        className={`relative group pl-7 border-l-2 transition-all ${
                          isPara3
                            ? "border-blue-500 bg-[#f4f7fc]/70 p-3.5 rounded-r-lg"
                            : isDemo && pNum === 4
                              ? "border-rose-400 bg-rose-50/40 p-3.5 rounded-r-lg text-rose-950"
                              : "border-transparent hover:border-slate-300"
                        }`}
                      >
                        <span className="absolute left-1 top-0 font-mono text-[10px] text-slate-400 select-none font-semibold">
                          #P{pNum}
                        </span>
                        {isPara3 ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between select-none pb-1 border-b border-blue-200/60">
                              <span className="font-mono text-[10px] font-bold text-blue-800 tracking-wider uppercase">
                                #P3 • Core Operative Clauses
                              </span>
                              <span className="text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded font-mono font-semibold">
                                2 Citations Linked
                              </span>
                            </div>
                            <p className="text-[#1c2434]">
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
                                className="cursor-pointer bg-blue-100/90 text-blue-950 font-medium px-1.5 py-0.5 rounded border-b-2 border-blue-600 hover:bg-blue-200 transition-all inline"
                              >
                                The program offers competitive non-repayable project grants of up to IDR 100,000,000 per selected proposal.
                              </mark>{" "}
                              <mark
                                id="doc-cite-E03"
                                onClick={() => setActiveEvidenceId("E03")}
                                className="cursor-pointer bg-amber-50 text-amber-950 font-normal px-1.5 py-0.5 rounded border-b border-dashed border-amber-600 hover:bg-amber-100 transition-all inline"
                              >
                                Detailed technical guidelines, budget breakdown sheets, and institutional endorsement portals can be accessed through the official portal.
                              </mark>
                            </p>
                          </div>
                        ) : (
                          isDemo ? (
                            <p>{para}</p>
                          ) : (
                            <HighlightedParagraph
                              text={para.trim()}
                              anchors={analysis.evidence.filter((anchor) => anchor.paragraph === pNum)}
                              activeEvidenceId={activeEvidenceId}
                              onSelect={setActiveEvidenceId}
                            />
                          )
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer status bar */}
                <div className="px-4 py-2 bg-[#f4f2ea] border-t border-[#dedacf] flex items-center justify-between text-xs font-mono text-slate-600 select-none">
                  <div className="flex items-center gap-2">
                    <span>{source.split(/\s+/).length} words</span>
                    <span>•</span>
                    <span>UTF-8 Canonical Ingest</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyText(source, "source")}
                    className="hover:text-blue-700 flex items-center gap-1 cursor-pointer font-sans text-xs"
                  >
                    <Copy size={13} />
                    <span>Copy Raw Text</span>
                  </button>
                </div>
              </section>

              {/* ===================================================================== */}
              {/* RIGHT PANE: EVIDENCE LEDGER + DECISION DOSSIER (~52% width)           */}
              {/* ===================================================================== */}
              <section className="flex-1 bg-[#f3f4f6] flex flex-col h-full overflow-y-auto select-none">
                {/* Header Strip with Live Provider Identification */}
                <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                    <span className="font-mono text-xs uppercase tracking-wider font-bold text-slate-800">
                      Investigation Ledger & Decision Dossier
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {providerBadge()}
                    <span className="text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                      <CheckCircle size={12} className="text-emerald-600" />
                      <span>{isDemo ? "98% Semantic Fit" : `${analysis.evidence.length} quotes found in source`}</span>
                    </span>
                  </div>
                </div>

                {/* Scrollable Intelligence Dashboard: real results for loaded documents, static dossier only for the demo */}
                {!isDemo ? (
                  <LiveDossier analysis={analysis} activeEvidenceId={activeEvidenceId} onJump={setActiveEvidenceId} />
                ) : (
                <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
                  {/* ================================================================= */}
                  {/* EVIDENCE LEDGER CITATION CARDS                                    */}
                  {/* ================================================================= */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <Link2 size={15} className="text-blue-600" />
                        <span>Evidence Ledger (Bi-Directional Citations)</span>
                      </h2>
                      <Link
                        href="/evidence-ledger"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-mono font-semibold"
                      >
                        <span>Full Forensic View</span>
                        <ChevronRight size={13} />
                      </Link>
                    </div>

                    {/* Card 1: Verified Grant Ceiling */}
                    <div
                      className={`bg-white border rounded-lg p-4 space-y-2.5 shadow-2xs transition-all ${
                        activeEvidenceId === "E02"
                          ? "border-blue-600 ring-2 ring-blue-500/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-xs font-mono font-bold bg-blue-600 text-white rounded">
                            [01]
                          </span>
                          <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                            VERIFIED SOURCE CLAIM
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                            Direct Verbatim Match
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveEvidenceId("E02")}
                          className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 flex items-center gap-1 cursor-pointer"
                        >
                          <Search size={12} />
                          <span>Jump to Passage</span>
                        </button>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-0.5">
                          Extracted Operative Finding
                        </span>
                        <p className="text-xs font-medium text-slate-900 leading-relaxed">
                          Maximum non-repayable institutional grant funding is IDR 100,000,000 per multidisciplinary undergraduate project team.
                        </p>
                      </div>
                      <div className="p-3 bg-[#fbfaf6] border-l-4 border-blue-600 rounded-r border border-[#e8e5d8] space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>LOCATION: Paragraph 3</span>
                          <span>CONFIDENCE: 0.98</span>
                        </div>
                        <blockquote className="font-serif italic text-xs text-slate-800 leading-relaxed">
                          “The program offers competitive non-repayable project grants of up to IDR 100,000,000 per selected proposal.”
                        </blockquote>
                      </div>
                    </div>

                    {/* Card 2: Open Clause / Caveat */}
                    <div
                      className={`bg-white border rounded-lg p-4 space-y-2.5 shadow-2xs transition-all ${
                        activeEvidenceId === "E03"
                          ? "border-amber-500 ring-2 ring-amber-500/20"
                          : "border-amber-200 hover:border-amber-300"
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-xs font-mono font-bold bg-amber-700 text-white rounded">
                            [02]
                          </span>
                          <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                            OPEN CLAUSE / CAVEAT NOTED
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
                            External Reference Required
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveEvidenceId("E03")}
                          className="px-2 py-1 text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 flex items-center gap-1 cursor-pointer"
                        >
                          <Search size={12} />
                          <span>Jump to Passage</span>
                        </button>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-0.5">
                          Extracted Operative Finding
                        </span>
                        <p className="text-xs text-slate-800 leading-relaxed">
                          Disbursement schedule, overhead cap deduction, and tranche breakdown are not specified in the primary announcement text.
                        </p>
                      </div>
                      <div className="p-3 bg-amber-50/40 border-l-4 border-amber-600 rounded-r border border-amber-200/80 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-amber-800/70">
                          <span>LOCATION: Paragraph 3, Clause 4</span>
                          <span>STATUS: External Reference</span>
                        </div>
                        <blockquote className="font-serif italic text-xs text-amber-950 leading-relaxed">
                          “Detailed technical guidelines, budget breakdown sheets, and institutional endorsement portals can be accessed through the official portal.”
                        </blockquote>
                      </div>
                    </div>
                  </div>

                  {/* ================================================================= */}
                  {/* DECISION WORKSPACE (Tailored Visual Domains from Stitch)          */}
                  {/* ================================================================= */}
                  <div className="space-y-4">
                    {/* CRITICAL TIMELINE BANNER */}
                    <div className="bg-[#0f172a] text-slate-100 rounded-xl p-5 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                          <span className="font-mono text-xs uppercase tracking-widest text-amber-400 font-bold">
                            CRITICAL TIMELINE & SUBMISSION CUTOFF
                          </span>
                        </div>
                        <span className="bg-amber-400 text-slate-950 font-bold px-2.5 py-0.5 rounded text-xs font-mono">
                          May 31, 2026 (23:59 WIB)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800 text-xs">
                        <div className="p-3 bg-slate-900/80 rounded border border-slate-800">
                          <span className="text-[10px] font-mono text-slate-400 block uppercase">
                            1. Intake Opened
                          </span>
                          <span className="font-semibold text-white block mt-0.5">Apr 15, 2026</span>
                          <span className="text-[10px] text-emerald-400 font-mono">Electronic Intake Open</span>
                        </div>
                        <div className="p-3 bg-amber-950/60 rounded border border-amber-600/60">
                          <span className="text-[10px] font-mono text-amber-300 block uppercase">
                            2. Strict Cutoff
                          </span>
                          <span className="font-bold text-amber-200 block mt-0.5">May 31, 2026 (23:59 WIB)</span>
                          <span className="text-[10px] text-rose-300 font-mono">No Appeal / Review Window</span>
                        </div>
                      </div>
                    </div>

                    {/* RISK RADAR & DISQUALIFICATION TRAPS */}
                    <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-amber-900 font-mono text-xs font-bold uppercase tracking-wider">
                        <AlertTriangle size={15} className="text-amber-700" />
                        <span>Risk Radar & Disqualification Traps</span>
                      </div>
                      <p className="text-xs text-amber-950 leading-relaxed">
                        <strong>Automatic Disqualification:</strong> Dossiers exceeding the strictly enforced 20-page cap or submitted after May 31, 2026 (23:59 WIB), or lacking a formal Dean endorsement letter with official institutional stamp, are discarded immediately without administrative appeal.
                      </p>
                    </div>

                    {/* UNKNOWN / UNVERIFIED INFORMATION */}
                    <div className="p-4 bg-slate-100 border border-slate-300 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-slate-800 font-mono text-xs font-bold uppercase tracking-wider">
                        <Clock size={15} className="text-slate-600" />
                        <span>Unknown / Missing Details in Notice</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        <strong>Clarification required:</strong> Co-funding permission (matching funds) and the precise milestone transfer percentages (e.g., 70/30) are absent from the circular text and require verification from internal university research bureaus.
                      </p>
                    </div>

                    {/* EXECUTION PLAN CHECKLIST */}
                    <div className="bg-white border border-slate-300 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                          Execution Plan (Next Steps for Proponents)
                        </span>
                        <span className="text-[11px] text-blue-700 font-bold font-mono">
                          PRIORITIZED DOSSIER
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded border border-slate-200">
                          <span className="w-5 h-5 rounded bg-blue-600 text-white font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                            1
                          </span>
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              Assemble Multidisciplinary Roster
                            </span>
                            <span className="text-slate-600">
                              Confirm 3+ active undergraduate students spanning at least two different STEAM majors.
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded border border-slate-200">
                          <span className="w-5 h-5 rounded bg-blue-600 text-white font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                            2
                          </span>
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              Draft 20-Page Strict Proposal & Budget
                            </span>
                            <span className="text-slate-600">
                              Ensure total budget ask does not exceed IDR 100,000,000 and total annexes do not exceed page limits.
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded border border-slate-200">
                          <span className="w-5 h-5 rounded bg-blue-600 text-white font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                            3
                          </span>
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              Procure Dean Endorsement Letter Before May 20
                            </span>
                            <span className="text-slate-600">
                              Mandatory signature and university stamp required prior to portal closing on May 31.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Audit Drawer Modal */}
      <EvidenceAuditDialog open={auditOpen} onOpenChange={setAuditOpen} />
    </WorkspaceShell>
  );
}
