"use client";

import { Clipboard, FileText } from "lucide-react";
import { getSourceSentences } from "./demo-analysis";
import type { EvidenceAnchor } from "./types";

type SourcePanelProps = {
  source: string;
  isDemo: boolean;
  isEditing: boolean;
  isLoading: boolean;
  evidence: EvidenceAnchor[];
  activeEvidenceId: string | null;
  error: string | null;
  copyMessage: string | null;
  onChange: (value: string) => void;
  onLoadDemo: () => void;
  onClear: () => void;
  onAnalyze: () => void;
  onEdit: () => void;
  onCopySource: () => void;
  onFocusEvidence: (id: string) => void;
  registerSourceAnchor: (id: string, element: HTMLSpanElement | null) => void;
};

const buttonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60";

export function SourcePanel({
  source,
  isDemo,
  isEditing,
  isLoading,
  evidence,
  activeEvidenceId,
  error,
  copyMessage,
  onChange,
  onLoadDemo,
  onClear,
  onAnalyze,
  onEdit,
  onCopySource,
  onFocusEvidence,
  registerSourceAnchor,
}: SourcePanelProps) {
  const paragraphs = source.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);

  return (
    <section
      id="source"
      aria-labelledby="source-heading"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <FileText size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 id="source-heading" className="text-base font-semibold text-slate-950">
              Source document
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              Evidence links point to exact passages in this text.
            </p>
          </div>
        </div>
        {isDemo ? (
          <span className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-950">
            Fictional demo text
          </span>
        ) : source ? (
          <span className="rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">
            User-provided text
          </span>
        ) : null}
      </header>

      {isEditing || !source ? (
        <div className="p-4 sm:p-5">
          <label htmlFor="announcement-source" className="mb-2 block text-sm font-medium text-slate-800">
            Announcement text
          </label>
          <textarea
            id="announcement-source"
            value={source}
            onChange={(event) => onChange(event.target.value)}
            disabled={isLoading}
            rows={12}
            placeholder="Paste the full announcement here..."
            className="min-h-64 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-800 placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          />
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onAnalyze}
              disabled={isLoading}
              className={`${buttonClass} border-slate-900 bg-slate-900 text-white hover:bg-slate-700 focus-visible:outline-white sm:px-5`}
            >
              {isLoading ? "Preparing prototype brief..." : "Prepare prototype brief"}
            </button>
            <button
              type="button"
              onClick={onLoadDemo}
              disabled={isLoading}
              className={`${buttonClass} border-slate-300 bg-white text-slate-800 hover:bg-slate-100`}
            >
              Load fictional sample
            </button>
            {source ? (
              <button
                type="button"
                onClick={onClear}
                disabled={isLoading}
                className={`${buttonClass} border-transparent bg-transparent text-slate-700 hover:bg-slate-100`}
              >
                Clear text
              </button>
            ) : null}
          </div>
          {error ? (
            <p className="mt-3 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900" role="alert">
              {error}
            </p>
          ) : null}
          <p className="mt-4 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-600">
            This screen uses local keyword rules only. It does not call Gemini or verify claims.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
            <p className="text-xs font-medium text-slate-600">
              {paragraphs.length} {paragraphs.length === 1 ? "paragraph" : "paragraphs"}
              <span className="px-2 text-slate-400" aria-hidden="true">/</span>
              {evidence.length} linked source {evidence.length === 1 ? "passage" : "passages"}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onCopySource}
                className={`${buttonClass} border-slate-300 bg-white text-slate-800 hover:bg-slate-100`}
              >
                <Clipboard size={15} aria-hidden="true" />
                Copy source
              </button>
              <button
                type="button"
                onClick={onEdit}
                className={`${buttonClass} border-slate-300 bg-white text-slate-800 hover:bg-slate-100`}
              >
                Edit source
              </button>
            </div>
          </div>
          <div className="max-h-[70vh] space-y-5 overflow-y-auto p-4 text-sm leading-7 text-slate-800 sm:p-5">
            {paragraphs.map((paragraph, paragraphIndex) => {
              const sentences = getSourceSentences(paragraph).map((sentence) => ({
                ...sentence,
                paragraph: paragraphIndex + 1,
              }));
              return (
                <p key={`${paragraphIndex}-${paragraph.slice(0, 24)}`} className="break-words">
                  <span className="mr-2 align-middle font-mono text-[0.68rem] font-semibold text-slate-500">
                    P{String(paragraphIndex + 1).padStart(2, "0")}
                  </span>
                  {sentences.map((sentence, sentenceIndex) => {
                    const anchor = evidence.find(
                      (item) => item.paragraph === paragraphIndex + 1 && item.quote === sentence.quote,
                    );
                    return (
                      <span key={`${sentenceIndex}-${sentence.quote.slice(0, 18)}`}>
                        {anchor ? (
                          <>
                            <span
                              ref={(element) => registerSourceAnchor(anchor.id, element)}
                              className={`rounded px-0.5 transition-colors ${
                                activeEvidenceId === anchor.id
                                  ? "bg-emerald-100 text-emerald-950 ring-2 ring-emerald-700"
                                  : "bg-emerald-50 decoration-emerald-700 underline decoration-1 underline-offset-2"
                              }`}
                            >
                              {sentence.quote}
                            </span>
                            <button
                              type="button"
                              onClick={() => onFocusEvidence(anchor.id)}
                              className="mx-1 inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-emerald-300 bg-white px-1.5 align-middle font-mono text-[0.68rem] font-bold text-emerald-900 hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                              aria-label={`Open evidence ${anchor.id} in the evidence list`}
                            >
                              {anchor.id}
                            </button>
                          </>
                        ) : (
                          sentence.quote
                        )}{" "}
                      </span>
                    );
                  })}
                </p>
              );
            })}
          </div>
          {copyMessage ? (
            <p className="border-t border-slate-200 px-4 py-2 text-sm text-slate-700" role="status">
              {copyMessage}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
