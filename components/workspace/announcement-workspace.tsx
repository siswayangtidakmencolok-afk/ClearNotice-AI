"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ClipboardList,
  FileText,
  Link2,
  Menu,
  X,
} from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";
import { useAnnouncement } from "./announcement-provider";
import { EvidenceAuditDialog } from "./evidence-audit-dialog";
import { getEvidenceStatus } from "./evidence-status";
import { SourcePanel } from "./source-panel";
import type { EvidenceStatus, Finding, PrototypeAnalysis } from "./types";

const navigation = [
  { href: "/", label: "Workspace", icon: ClipboardList },
  { href: "/source-document", label: "Source document", icon: FileText },
  { href: "/analysis-brief", label: "Analysis brief", icon: CalendarDays },
  { href: "/evidence-ledger", label: "Evidence ledger", icon: Link2 },
];

const statusCopy: Record<EvidenceStatus, string> = {
  supported: "Text match",
  "needs-verification": "Needs verification",
  unknown: "Unknown",
};

const statusStyle: Record<EvidenceStatus, string> = {
  supported: "border-emerald-300 bg-emerald-50 text-emerald-950",
  "needs-verification": "border-amber-300 bg-amber-50 text-amber-950",
  unknown: "border-slate-300 bg-slate-100 text-slate-800",
};

function StatusLabel({ status }: { status: EvidenceStatus }) {
  return (
    <span className={`inline-flex min-h-7 items-center rounded-md border px-2 py-1 text-xs font-semibold ${statusStyle[status]}`}>
      {statusCopy[status]}
    </span>
  );
}

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-slate-600" aria-hidden="true">
        {icon}
      </span>
      <div>
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        {description ? <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p> : null}
      </div>
    </div>
  );
}

function FindingRows({
  findings,
  onLocateSource,
  analysis,
}: {
  findings: Finding[];
  onLocateSource: (id: string) => void;
  analysis: PrototypeAnalysis;
}) {
  if (findings.length === 0) {
    return <p className="mt-3 text-sm leading-6 text-slate-700">No warning was detected by these local prototype rules. Review the full source.</p>;
  }

  return (
    <ul className="mt-3 divide-y divide-slate-200">
      {findings.map((finding) => (
        <li key={finding.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-800">{finding.label}</p>
            <StatusLabel
              status={finding.evidenceId ? getEvidenceStatus(analysis, finding.evidenceId) : finding.status}
            />
          </div>
          <p className="mt-2 break-words text-sm leading-6 text-slate-800">{finding.detail}</p>
          {finding.evidenceId ? (
            <button
              type="button"
              onClick={() => onLocateSource(finding.evidenceId!)}
              className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              <Link2 size={14} aria-hidden="true" />
              Locate source {finding.evidenceId}
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function FindingSection({
  id,
  title,
  description,
  findings,
  onLocateSource,
  analysis,
}: {
  id?: string;
  title: string;
  description?: string;
  findings: Finding[];
  onLocateSource: (id: string) => void;
  analysis: PrototypeAnalysis;
}) {
  return (
    <section id={id} className="border-t border-slate-200 pt-4">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      {description ? <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p> : null}
      <FindingRows findings={findings} onLocateSource={onLocateSource} analysis={analysis} />
    </section>
  );
}

function EvidenceCard({
  id,
  paragraph,
  quote,
  status,
  active,
  onLocateSource,
  onCopy,
  registerRef,
}: {
  id: string;
  paragraph: number;
  quote: string;
  status: EvidenceStatus;
  active: boolean;
  onLocateSource: (id: string) => void;
  onCopy: (quote: string, id: string) => void;
  registerRef: (id: string, element: HTMLLIElement | null) => void;
}) {
  return (
    <li
      ref={(element) => registerRef(id, element)}
      className={`rounded-lg border p-3 transition-colors ${
        active ? "border-blue-700 bg-blue-50" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs font-semibold text-slate-950">
          {id} <span className="font-sans font-medium text-slate-600">Paragraph {paragraph}</span>
        </p>
        <StatusLabel status={status} />
      </div>
      <blockquote className="mt-3 border-l-2 border-blue-700 pl-3 text-sm leading-6 text-slate-800">
        {quote}
      </blockquote>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onLocateSource(id)}
          className="inline-flex min-h-11 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          Locate in source
        </button>
        <button
          type="button"
          onClick={() => onCopy(quote, id)}
          className="inline-flex min-h-11 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          Copy citation
        </button>
      </div>
    </li>
  );
}

export function AnalysisPanel({
  analysis,
  isDemo,
  activeEvidenceId,
  copyMessage,
  onLocateSource,
  onCopy,
  registerEvidenceCard,
}: {
  analysis: PrototypeAnalysis;
  isDemo: boolean;
  activeEvidenceId: string | null;
  copyMessage: string | null;
  onLocateSource: (id: string) => void;
  onCopy: (quote: string, id: string) => void;
  registerEvidenceCard: (id: string, element: HTMLLIElement | null) => void;
}) {
  return (
    <section id="analysis" aria-labelledby="analysis-heading" className="min-w-0 flex flex-col gap-4">
      <article className="order-0 border border-slate-300 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-blue-800">
              Announcement investigation
            </p>
            <h2 id="analysis-heading" className="mt-2 font-serif text-2xl font-semibold tracking-tight text-slate-950">
              Decision brief
            </h2>
          </div>
          <span className="rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-950">
            {isDemo ? "Fictional demo" : "Local prototype"}
          </span>
        </div>
        <p className="mt-4 max-w-prose text-sm leading-6 text-slate-700">
          This view uses local keyword rules, not Gemini. Quoted passages are linked to the pasted source. Interpretations still need review.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
          <span className="text-xs font-semibold text-slate-700">Tentative type</span>
          <StatusLabel status={analysis.announcementType.status} />
          <span className="text-sm text-slate-800">{analysis.announcementType.detail}</span>
          {analysis.announcementType.evidenceId ? (
            <button
              type="button"
              onClick={() => onLocateSource(analysis.announcementType.evidenceId!)}
              className="inline-flex min-h-11 items-center rounded-md px-3 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              Source {analysis.announcementType.evidenceId}
            </button>
          ) : null}
        </div>
      </article>

      <section className="order-2 border border-slate-300 bg-white p-4 sm:p-5">
        <SectionTitle
          icon={<CalendarDays size={17} />}
          title="Dates and deadlines"
          description="Original source wording is retained. The prototype does not normalize dates."
        />
        {analysis.importantDates.length > 0 ? (
          <ol className="mt-4 space-y-0 border-l border-slate-300 pl-4">
            {analysis.importantDates.map((date) => (
              <li key={date.id} className="relative py-2 first:pt-0 last:pb-0">
                <span className="absolute -left-[1.34rem] top-3 size-2 rounded-full bg-emerald-700 ring-4 ring-white" aria-hidden="true" />
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold text-slate-800">{date.label}</p>
                  <StatusLabel
                    status={date.evidenceId ? getEvidenceStatus(analysis, date.evidenceId) : date.status}
                  />
                </div>
                <p className="mt-1 break-words text-sm leading-6 text-slate-800">{date.detail}</p>
                {date.evidenceId ? (
                  <button
                    type="button"
                    onClick={() => onLocateSource(date.evidenceId!)}
                    className="mt-1 inline-flex min-h-11 items-center rounded-md px-3 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                  >
                    Locate {date.evidenceId} in source
                  </button>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-sm text-slate-700">No clear date mention was found by the local prototype rules.</p>
        )}
      </section>

      <section id="evidence" className="order-1 border border-blue-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionTitle
            icon={<Link2 size={17} />}
            title="Evidence ledger"
            description="Each citation is an exact passage from the source text."
          />
          <EvidenceAuditDialog evidence={analysis.evidence} onCopy={onCopy} />
        </div>
        {analysis.evidence.length > 0 ? (
          <ol className="mt-4 space-y-3">
            {analysis.evidence.map((anchor) => (
              <EvidenceCard
                key={anchor.id}
                id={anchor.id}
                paragraph={anchor.paragraph}
                quote={anchor.quote}
                status={getEvidenceStatus(analysis, anchor.id)}
                active={activeEvidenceId === anchor.id}
                onLocateSource={onLocateSource}
                onCopy={onCopy}
                registerRef={registerEvidenceCard}
              />
            ))}
          </ol>
        ) : (
          <p className="mt-4 rounded border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-700">
            No source passage was matched. Treat all extracted details as unknown.
          </p>
        )}
        {copyMessage ? <p className="mt-3 text-sm text-slate-700" role="status">{copyMessage}</p> : null}
      </section>

      <div className="order-3 border border-slate-300 bg-white p-4 sm:p-5">
        <SectionTitle
          icon={<ClipboardList size={17} />}
          title="Eligibility and requirements"
          description="Items are shown only when the local rules find a matching source sentence."
        />
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <FindingSection title="Eligibility" findings={analysis.eligibility} onLocateSource={onLocateSource} analysis={analysis} />
          <FindingSection title="Requirements" findings={analysis.requirements} onLocateSource={onLocateSource} analysis={analysis} />
        </div>
      </div>

      <div className="order-4 border border-slate-300 bg-white p-4 sm:p-5">
        <FindingSection
          title="Costs and fees"
          description="No fee is inferred when the source text does not state one."
          findings={analysis.costsAndFees}
          onLocateSource={onLocateSource}
          analysis={analysis}
        />
      </div>

      <div className="order-5 border border-slate-300 bg-white p-4 sm:p-5">
        <SectionTitle
          icon={<Check size={17} />}
          title="Action plan"
          description="Actions below quote source instructions. The prototype does not schedule reminders."
        />
        <ol className="mt-4 space-y-3">
          {analysis.actionItems.map((action, index) => (
            <li key={action.id} className="flex gap-3 border-t border-slate-200 pt-3 first:border-0 first:pt-0">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-slate-300 font-mono text-xs font-semibold text-slate-800">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold text-slate-800">{action.label}</p>
                  <StatusLabel
                    status={action.evidenceId ? getEvidenceStatus(analysis, action.evidenceId) : action.status}
                  />
                </div>
                <p className="mt-1 break-words text-sm leading-6 text-slate-800">{action.detail}</p>
                {action.evidenceId ? (
                  <button
                    type="button"
                    onClick={() => onLocateSource(action.evidenceId!)}
                    className="mt-1 inline-flex min-h-11 items-center rounded-md px-3 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                  >
                    Source {action.evidenceId}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="order-6 grid gap-4 md:grid-cols-2">
        <div className="border border-amber-300 bg-amber-50/70 p-4 sm:p-5">
          <SectionTitle
            icon={<AlertTriangle size={17} />}
            title="Warnings"
            description="No warning should be treated as absent unless the source was reviewed."
          />
          <FindingRows findings={analysis.warnings} onLocateSource={onLocateSource} analysis={analysis} />
        </div>
        <div className="border border-slate-300 bg-slate-100 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-950">Unknown or missing</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            These items were not identified by the local rules. Check the original notice.
          </p>
          <FindingRows findings={analysis.unknowns} onLocateSource={onLocateSource} analysis={analysis} />
        </div>
      </div>
    </section>
  );
}

export function AnnouncementWorkspace() {
  const {
    source,
    isDemo,
    isEditing,
    analysis,
    isLoading,
    error,
    activeEvidenceId,
    copyMessage,
    changeSource,
    loadDemo,
    clearSource,
    prepareBrief,
    startEditing,
    setActiveEvidenceId,
    copyText,
  } = useAnnouncement();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileNavigationId = useId();
  const pathname = usePathname();
  const sourceAnchors = useRef<Record<string, HTMLSpanElement | null>>({});
  const evidenceCards = useRef<Record<string, HTMLLIElement | null>>({});

  const scrollBehavior = (): ScrollBehavior =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

  const locateSource = (id: string) => {
    setActiveEvidenceId(id);
    sourceAnchors.current[id]?.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
  };

  const focusEvidence = (id: string) => {
    setActiveEvidenceId(id);
    evidenceCards.current[id]?.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
  };

  return (
    <div id="workspace" className="min-h-screen bg-[#f2f3f5] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#0b1120] text-slate-200">
        <div className="flex min-h-14 items-center justify-between gap-4 border-b border-slate-800 px-4 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded bg-blue-700 font-mono text-xs font-bold text-white" aria-hidden="true">
              CN
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">ClearNotice AI</p>
              <p className="hidden text-xs text-slate-400 sm:block">Announcement investigation workspace</p>
            </div>
          </div>

          <nav aria-label="Workspace navigation" className="hidden min-w-0 items-center gap-1 lg:flex">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={`inline-flex min-h-11 items-center gap-2 rounded px-3 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
                  pathname === href
                    ? "bg-blue-700 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={15} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {analysis ? (
              <Link
                href="/evidence-ledger"
                className="hidden min-h-11 items-center gap-2 rounded border border-slate-700 bg-slate-900 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 sm:inline-flex"
              >
                <Link2 size={15} aria-hidden="true" />
                Review evidence
              </Link>
            ) : null}
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Close workspace navigation" : "Open workspace navigation"}
              aria-expanded={mobileMenuOpen}
              aria-controls={mobileNavigationId}
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 lg:hidden"
            >
              {mobileMenuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            </button>
          </div>
        </div>

        <nav
          id={mobileNavigationId}
          aria-label="Workspace navigation"
          className={`${mobileMenuOpen ? "grid" : "hidden"} grid-cols-2 gap-1 border-b border-slate-800 bg-[#080d19] px-4 py-2 lg:hidden`}
        >
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex min-h-11 items-center gap-2 rounded px-2 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 ${
                pathname === href
                  ? "bg-blue-700 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex min-h-10 flex-wrap items-center justify-between gap-x-4 gap-y-1 bg-[#080d19] px-4 py-2 text-xs sm:px-6">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-medium text-slate-200">
              {isDemo ? "Fictional sample text" : source.trim() ? "User-provided text" : "No source added"}
            </span>
            <span className="text-slate-600" aria-hidden="true">/</span>
            <span className="text-slate-400">Stored in this page session only</span>
          </div>
          <span className="text-slate-400">Text matching only. No external verification or audit history.</span>
        </div>
      </header>

      <main className="grid min-w-0 grid-cols-1 lg:grid-cols-[minmax(0,0.48fr)_minmax(0,0.52fr)]">
        <div className="min-w-0 border-b border-[#dcdad0] bg-[#fbfaf6] lg:border-b-0 lg:border-r">
          <SourcePanel
            source={source}
            isDemo={isDemo}
            isEditing={isEditing}
            isLoading={isLoading}
            evidence={analysis?.evidence ?? []}
            activeEvidenceId={activeEvidenceId}
            error={error}
            copyMessage={copyMessage}
            onChange={changeSource}
            onLoadDemo={loadDemo}
            onClear={clearSource}
            onAnalyze={prepareBrief}
            onEdit={startEditing}
            onCopySource={() => void copyText(source, "source")}
            onFocusEvidence={focusEvidence}
            registerSourceAnchor={(id, element) => {
              sourceAnchors.current[id] = element;
            }}
          />
        </div>

        <section className="min-w-0 bg-[#f2f3f5] px-4 py-5 sm:px-6 sm:py-6" aria-label="Investigation findings">
          {analysis ? (
            <AnalysisPanel
              analysis={analysis}
              isDemo={isDemo}
              activeEvidenceId={activeEvidenceId}
              copyMessage={copyMessage}
              onLocateSource={locateSource}
              onCopy={(quote, id) => void copyText(quote, id)}
              registerEvidenceCard={(id, element) => {
                evidenceCards.current[id] = element;
              }}
            />
          ) : (
            <section
              id="analysis"
              aria-labelledby="empty-heading"
              aria-busy={isLoading}
              className="flex min-h-72 flex-col justify-between border border-slate-300 bg-white p-5 sm:p-7"
            >
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-blue-800">
                  Investigation brief
                </p>
                <h2 id="empty-heading" className="mt-3 font-serif text-2xl font-semibold text-slate-950">
                  {isLoading ? "Preparing a local prototype brief" : "No brief prepared"}
                </h2>
                <p className="mt-3 max-w-prose text-sm leading-6 text-slate-700">
                  {isLoading
                    ? "Matching relevant sentences to source passages. This local prototype does not call Gemini."
                    : "Paste a notice to begin. The source remains primary, and details without a matching passage stay unknown."}
                </p>
                {error ? (
                  <p className="mt-4 border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
              <p className="mt-8 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-600" role="status" aria-live="polite">
                {isLoading
                  ? "Preparing source-linked findings..."
                  : "A text match records what appears in the input. It does not confirm the announcement independently."}
              </p>
            </section>
          )}
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-600 sm:px-6">
        ClearNotice AI prototype. Review the original announcement before acting.
      </footer>
    </div>
  );
}
