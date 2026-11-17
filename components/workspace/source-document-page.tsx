"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SourcePanel } from "./source-panel";
import { WorkspaceShell } from "./workspace-shell";
import { useAnnouncement } from "./announcement-provider";

export function SourceDocumentPage() {
  const router = useRouter();
  const {
    source,
    isDemo,
    isLoading,
    analysis,
    activeEvidenceId,
    error,
    copyMessage,
    changeSource,
    loadDemo,
    clearSource,
    prepareBrief,
    startEditing,
    setActiveEvidenceId,
    copyText,
  } = useAnnouncement();
  const sourceAnchors = useRef<Record<string, HTMLSpanElement | null>>({});

  useEffect(() => {
    if (!activeEvidenceId) return;
    sourceAnchors.current[activeEvidenceId]?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center",
    });
  }, [activeEvidenceId, source]);

  const openEvidence = (id: string) => {
    setActiveEvidenceId(id);
    router.push("/evidence-ledger");
  };

  return (
    <WorkspaceShell>
      <div className="space-y-4">
        {isLoading ? (
          <p className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800" role="status">
            Preparing the local prototype brief...
          </p>
        ) : null}
        {error ? (
          <p className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900" role="alert">
            {error}
          </p>
        ) : null}
        {source ? (
          <SourcePanel
            source={source}
            isDemo={isDemo}
            isEditing={false}
            isLoading={isLoading}
            evidence={analysis?.evidence ?? []}
            activeEvidenceId={activeEvidenceId}
            error={null}
            copyMessage={copyMessage}
            onChange={changeSource}
            onLoadDemo={loadDemo}
            onClear={clearSource}
            onAnalyze={prepareBrief}
            onEdit={() => {
              startEditing();
              router.push("/");
            }}
            onCopySource={() => void copyText(source, "source")}
            onFocusEvidence={openEvidence}
            registerSourceAnchor={(id, element) => {
              sourceAnchors.current[id] = element;
            }}
          />
        ) : !isLoading ? (
          <section className="rounded-xl border border-slate-300 bg-white p-5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Source document</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">No announcement added</h2>
            <p className="mt-3 max-w-prose text-sm leading-6 text-slate-700">
              Add text in the workspace to read the source and navigate to its cited passages.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              >
                Add an announcement
              </button>
              <button
                type="button"
                onClick={() => {
                  loadDemo();
                  router.push("/");
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              >
                Load fictional sample
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </WorkspaceShell>
  );
}
