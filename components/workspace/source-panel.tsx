"use client";

import { Clipboard, FileText } from "lucide-react";
import { useState } from "react";
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
  "inline-flex min-h-11 items-center justify-center gap-2 rounded border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-60";

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
  const [query, setQuery] = useState("");
  const [annotated, setAnnotated] = useState(true);
  const paragraphs = source.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const visibleParagraphs = paragraphs
    .map((paragraph, index) => ({ paragraph, index }))
    .filter(({ paragraph }) => paragraph.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <section
      id="source"
      aria-labelledby="source-heading"
      className="min-w-0 overflow-hidden border border-[#dfdcce] bg-[#fbfaf6]"
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#dfdcce] bg-[#f4f2ea] px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded bg-white text-slate-700">
            <FileText size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-600">
              Primary source
            </p>
            <h2 id="source-heading" className="mt-1 font-serif text-lg font-semibold text-slate-950">
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
          <label htmlFor="announcement-source" className="mb-2 block font-mono text-xs font-semibold uppercase tracking-wide text-slate-700">
            Paste the original announcement
          </label>
          <textarea
            id="announcement-source"
            value={source}
            onChange={(event) => onChange(event.target.value)}
            disabled={isLoading}
            rows={12}
            placeholder="Paste the full announcement here..."
            className="min-h-64 w-full resize-y rounded border border-[#d6d3c8] bg-white p-4 font-serif text-[15px] leading-7 text-slate-800 placeholder:font-sans placeholder:text-sm placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          />
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onAnalyze}
              disabled={isLoading}
              className={`${buttonClass} border-blue-800 bg-blue-800 text-white hover:bg-blue-900 sm:px-5`}
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
          <p className="mt-4 border-t border-[#dfdcce] pt-3 text-xs leading-5 text-slate-600">
            This screen uses local keyword rules only. It does not call Gemini or verify claims.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dfdcce] bg-[#f4f2ea] px-4 py-3 sm:px-5">
            <p className="text-xs font-medium text-slate-700">
              {paragraphs.length} {paragraphs.length === 1 ? "paragraph" : "paragraphs"}
              <span className="px-2 text-slate-500" aria-hidden="true">/</span>
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
          <div className="space-y-3 border-b border-[#dfdcce] bg-white px-4 py-3 sm:px-5">
              {paragraphs.length ? (
                <nav aria-label="Jump to source paragraph" className="flex gap-1 overflow-x-auto pb-1">
                  {visibleParagraphs.map(({ index }) => (
                    <a
                      key={`paragraph-jump-${index + 1}`}
                      href={`#source-paragraph-${index + 1}`}
                      className="inline-flex min-h-10 shrink-0 items-center rounded bg-[#f4f2ea] px-3 font-mono text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                    >
                      P{String(index + 1).padStart(2, "0")}
                    </a>
                  ))}
                </nav>
              ) : null}
              <label htmlFor="source-search" className="block text-xs font-medium text-slate-700">
                Find a phrase in this source
                <input
                  id="source-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search source text"
                  className="mt-1 min-h-11 w-full rounded border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                />
              </label>
              {evidence.length ? (
                <div className="inline-flex rounded border border-[#d6d3c8] bg-[#f4f2ea] p-0.5">
                  <button
                    type="button"
                    aria-pressed={annotated}
                    onClick={() => setAnnotated(true)}
                    className={`min-h-10 rounded px-3 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
                      annotated ? "bg-white text-slate-900" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Annotated evidence
                  </button>
                  <button
                    type="button"
                    aria-pressed={!annotated}
                    onClick={() => setAnnotated(false)}
                    className={`min-h-10 rounded px-3 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
                      !annotated ? "bg-white text-slate-900" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Clean reader
                  </button>
                </div>
              ) : null}
          </div>
          <div className="max-h-[70vh] space-y-5 overflow-y-auto bg-[#fbfaf6] p-4 font-serif text-[15px] leading-7 text-slate-800 sm:p-5">
              {visibleParagraphs.map(({ paragraph, index: paragraphIndex }) => {
              const sentences = getSourceSentences(paragraph).map((sentence) => ({
                ...sentence,
                paragraph: paragraphIndex + 1,
              }));
              return (
                <p
                  key={`${paragraphIndex}-${paragraph.slice(0, 24)}`}
                  id={`source-paragraph-${paragraphIndex + 1}`}
                  className="scroll-mt-24 break-words border-l-2 border-transparent py-1 pl-7 pr-2"
                >
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
                              className={`rounded-sm px-0.5 transition-colors ${
                                activeEvidenceId === anchor.id
                                  ? "bg-blue-100 text-blue-950 ring-2 ring-blue-700"
                                  : annotated
                                    ? "bg-blue-50 decoration-blue-700 underline decoration-1 underline-offset-2"
                                    : "text-slate-800"
                              }`}
                            >
                              {sentence.quote}
                            </span>
                            <button
                              type="button"
                              onClick={() => onFocusEvidence(anchor.id)}
                              className="mx-1 inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-blue-300 bg-white px-1.5 align-middle font-mono text-[0.68rem] font-bold text-blue-900 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
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
            {visibleParagraphs.length === 0 ? (
              <p className="border border-slate-300 bg-white p-4 font-sans text-sm text-slate-700" role="status">
                No source paragraphs match this search.
              </p>
            ) : null}
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
