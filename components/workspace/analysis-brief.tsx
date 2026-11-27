"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FileText,
  CalendarDays,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Link2,
  Download,
  Share2,
  ChevronDown,
  ShieldCheck,
  Check,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { useAnnouncement } from "./announcement-provider";
import { EvidenceAuditDialog } from "./evidence-audit-dialog";

export function AnalysisBriefPage() {
  const router = useRouter();
  const {
    analysis,
    isDemo,
    isLoading,
    error,
    activeEvidenceId,
    setActiveEvidenceId,
    loadCanonicalDemo,
  } = useAnnouncement();

  const [auditOpen, setAuditOpen] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);

  if (!analysis) {
    return (
      <div className="bg-white border border-slate-300 rounded-xl p-8 max-w-xl mx-auto text-center space-y-5 my-12 shadow-sm">
        <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mx-auto border border-blue-200">
          <CalendarDays size={24} />
        </div>
        <h2 className="font-serif font-bold text-xl text-slate-900">No Brief Prepared Yet</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Input an announcement in the workspace or load the canonical demonstration notice to generate a comprehensive analysis brief.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={loadCanonicalDemo}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Load Canonical NSIG Brief
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

  const navigateToEvidence = (id: string) => {
    setActiveEvidenceId(id);
    router.push("/source-document");
  };

  const sections = [
    { id: "sec-profile", label: "Announcement Profile" },
    { id: "sec-executive", label: "1. Executive Summary" },
    { id: "sec-dates", label: "2. Important Dates" },
    { id: "sec-eligibility", label: "3. Eligibility Criteria" },
    { id: "sec-requirements", label: "4. Required Documents" },
    { id: "sec-costs", label: "5. Costs & Allocation" },
    { id: "sec-actions", label: "6. Operational Action Plan" },
    { id: "sec-unknowns", label: "7. Warnings & Unknowns" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full pb-16">
      {/* ========================================================================= */}
      {/* 1. TOP META STRIP / AUDIT STATUS (From Stitch analysis-brief.html)        */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 text-blue-900 border border-blue-200 font-mono text-[11px] font-semibold uppercase tracking-wider">
              <ShieldCheck size={13} className="text-blue-700" />
              <span>Statutory Legal Intelligence</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 font-mono text-[11px] font-semibold uppercase tracking-wider">
              <CheckCircle size={13} className="text-emerald-700" />
              <span>
                {analysis.provider === "gemini"
                  ? `Google Gemini Analysis (${analysis.modelId})`
                  : analysis.provider === "openrouter"
                    ? `OpenRouter Fallback (${analysis.modelId})`
                    : "Canonical Synchronized Dossier (Verified)"}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
            {isDemo && (
              <>
                <span className="px-2 py-1 bg-slate-100 rounded text-slate-700">
                  SHA-256: 8f4e2...90a1
                </span>
                <span className="hidden sm:inline px-2 py-1 bg-slate-100 rounded text-slate-700">
                  Ingested: 15-Apr-2026 09:30 WIB
                </span>
              </>
            )}
          </div>
        </div>

        {/* Title and Controls Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1 border-t border-slate-100">
          <div>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Analysis Brief
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Understand the requirements, deadlines, and decisions that matter. Derived autonomously from official circular filings.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Jump Menu Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setJumpOpen(!jumpOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition-colors cursor-pointer"
              >
                <span>Jump to Section</span>
                <ChevronDown size={14} />
              </button>
              {jumpOpen && (
                <div className="absolute right-0 mt-1 w-56 rounded-lg bg-white border border-slate-200 shadow-lg z-30 py-1 text-xs">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      onClick={() => setJumpOpen(false)}
                      className="block px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-950 font-medium"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setAuditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition-colors cursor-pointer"
            >
              <Sparkles size={14} className="text-blue-600" />
              <span>Audit Trail</span>
            </button>

            <Link
              href="/source-document"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <FileText size={14} />
              <span>Compare with Source</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN REPORT CANVAS & EVIDENCE RAIL (2-Column Grid)                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Content (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* SECTION: ANNOUNCEMENT PROFILE */}
          <section id="sec-profile" className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <CheckCircle size={15} className="text-blue-600" />
                <span>Announcement Profile</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold">
                ACTIVE NOTICE
              </span>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                  Announcement Type
                </span>
                <span className="font-semibold text-slate-900 text-sm">
                  {analysis.announcementType?.detail || (isDemo ? "Statutory Circular / Public Competitive Grant" : "Not stated in the source.")}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                  Issuing Authority
                </span>
                <span className="font-medium text-slate-800">
                  {analysis.overview?.organizer?.detail || (isDemo ? "Directorate General of Higher Education (MoECRT Indonesia)" : "Not stated in the source.")}
                </span>
              </div>
              {isDemo && (
                <>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                      Canonical Reference
                    </span>
                    <div className="flex items-center gap-1.5 text-blue-600">
                      <a href="https://moecrt.go.id/nsig-2026" target="_blank" rel="noreferrer" className="underline truncate max-w-[200px]">
                        https://moecrt.go.id/nsig-2026
                      </a>
                      <ExternalLink size={12} />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                      Ingestion Timeline
                    </span>
                    <span className="text-slate-700">
                      Published: <strong>April 15, 2026</strong> • Ingested: 15-Apr-2026
                    </span>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* SECTION 1: EXECUTIVE SUMMARY */}
          <section id="sec-executive" className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center gap-2">
              <FileText size={15} className="text-blue-600" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800">
                1. Executive Summary & Decision Framework
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[#fcfbf9] border-l-4 border-blue-600 p-4 rounded-r-lg border border-[#e8e5d8]">
                <p className="font-serif text-sm leading-relaxed text-slate-800">
                  {analysis.overview?.summary ||
                    "The Ministry of Education, Culture, Research, and Technology has published statutory directives governing the 2026 National Student Innovation Grant (NSIG). The program provides competitive non-repayable capital injections of up to IDR 100,000,000 to multidisciplinary undergraduate teams."}
                  <button
                    type="button"
                    onClick={() => navigateToEvidence("E02")}
                    className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-900 font-mono text-[10px] font-bold cursor-pointer"
                  >
                    [01]
                  </button>
                </p>
              </div>

              {analysis.keyFacts && analysis.keyFacts.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Core Operative Claims
                  </span>
                  <ul className="space-y-2 text-xs">
                    {analysis.keyFacts.map((kf, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-800 bg-slate-50 p-2.5 rounded border border-slate-200">
                        <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block">{kf.label}</span>
                          <span className="text-slate-600 leading-relaxed">{kf.detail}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 2: IMPORTANT DATES */}
          <section id="sec-dates" className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Clock size={15} className="text-amber-600" />
                <span>2. Important Dates & Submission Timeline</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-semibold">
                STRICT CUTOFF
              </span>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {analysis.importantDates.map((date, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                      {date.label}
                    </span>
                    <span className="font-bold text-slate-900 block text-sm">{date.detail}</span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded inline-block">
                      {date.status === "supported" ? "Verified in circular" : "Needs review"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 3: ELIGIBILITY CRITERIA */}
          <section id="sec-eligibility" className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center gap-2">
              <CheckCircle size={15} className="text-emerald-600" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800">
                3. Target Audience & Eligibility Criteria
              </h2>
            </div>
            <div className="p-5 space-y-2 text-xs">
              {analysis.eligibility.map((el, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-900 block">{el.label}</span>
                  <p className="text-slate-600 leading-relaxed">{el.detail}</p>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 4: REQUIRED DOCUMENTS */}
          <section id="sec-requirements" className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center gap-2">
              <FileText size={15} className="text-blue-600" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800">
                4. Required Documents & Statutory Filings
              </h2>
            </div>
            <div className="p-5 space-y-2 text-xs">
              {analysis.requirements.map((req, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-900 block">{req.label}</span>
                  <p className="text-slate-600 leading-relaxed">{req.detail}</p>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 5: COSTS AND ALLOCATION */}
          <section id="sec-costs" className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center gap-2">
              <Sparkles size={15} className="text-emerald-600" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800">
                5. Capital Allocation & Funding Ceilings
              </h2>
            </div>
            <div className="p-5 space-y-2 text-xs">
              {analysis.costsAndFees.map((cost, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-900 block">{cost.label}</span>
                  <p className="text-slate-600 leading-relaxed">{cost.detail}</p>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 6: OPERATIONAL ACTION PLAN */}
          <section id="sec-actions" className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800">
                6. Operational Action Plan (Prioritized Dossier)
              </span>
              <span className="text-[10px] font-mono text-blue-700 font-bold">EXECUTION CHECKLIST</span>
            </div>
            <div className="p-5 space-y-2.5 text-xs">
              {(analysis.nextSteps || analysis.actionItems).map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="w-5 h-5 rounded bg-blue-600 text-white font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-900 block">{step.label}</span>
                    <p className="text-slate-600 leading-relaxed">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 7: WARNINGS & UNKNOWNS */}
          <section id="sec-unknowns" className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-600" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800">
                7. Warnings, Risk Traps & Unknowns
              </h2>
            </div>
            <div className="p-5 space-y-3 text-xs">
              {analysis.warnings.map((warn, i) => (
                <div key={i} className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-950 space-y-1">
                  <span className="font-bold block flex items-center gap-1.5 text-amber-900">
                    <AlertTriangle size={13} className="text-amber-700" />
                    <span>{warn.label}</span>
                  </span>
                  <p className="leading-relaxed">{warn.detail}</p>
                </div>
              ))}

              {analysis.unknowns.map((unk, i) => (
                <div key={i} className="p-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 space-y-1">
                  <span className="font-bold block flex items-center gap-1.5 text-slate-700 font-mono text-[11px] uppercase">
                    <Clock size={13} />
                    <span>Missing Information: {unk.label}</span>
                  </span>
                  <p className="leading-relaxed text-slate-600">{unk.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Rail: Evidence Anchors Rail (4 cols) */}
        <aside className="lg:col-span-4 space-y-4 sticky top-20">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Link2 size={14} className="text-blue-600" />
                <span>Source Citations ({analysis.evidence.length})</span>
              </h3>
              <Link
                href="/evidence-ledger"
                className="text-[11px] font-mono text-blue-600 hover:underline font-semibold"
              >
                All Records →
              </Link>
            </div>

            <div className="space-y-2.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {analysis.evidence.map((anchor) => (
                <div
                  key={anchor.id}
                  onClick={() => navigateToEvidence(anchor.id)}
                  className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 transition-all cursor-pointer space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white font-bold">
                      [{anchor.id}]
                    </span>
                    <span className="text-slate-500">Paragraph {anchor.paragraph}</span>
                  </div>
                  <blockquote className="font-serif italic text-slate-700 line-clamp-3 leading-snug">
                    “{anchor.quote}”
                  </blockquote>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Audit Drawer Modal */}
      <EvidenceAuditDialog open={auditOpen} onOpenChange={setAuditOpen} />
    </div>
  );
}
