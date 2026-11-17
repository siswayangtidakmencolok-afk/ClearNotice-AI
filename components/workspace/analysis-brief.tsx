"use client";

import { useRouter } from "next/navigation";
import { AnalysisPanel } from "./announcement-workspace";
import { useAnnouncement } from "./announcement-provider";

export function AnalysisBriefPage() {
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

  if (!analysis) {
    return (
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
        {!isLoading ? (
          <section className="rounded-xl border border-slate-300 bg-white p-5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
              Analysis brief
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">No brief prepared</h2>
            <p className="mt-3 max-w-prose text-sm leading-6 text-slate-700">
              Add an announcement in the workspace to prepare a local, source-linked prototype brief.
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

  return (
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
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
        {isDemo ? "Fictional demo content. " : "Local prototype result. "}
        This brief uses keyword rules, not Gemini or external verification.
      </div>
      <AnalysisPanel
        analysis={analysis}
        isDemo={isDemo}
        activeEvidenceId={activeEvidenceId}
        copyMessage={copyMessage}
        onLocateSource={locateSource}
        onCopy={(quote, id) => void copyText(quote, id)}
        registerEvidenceCard={() => undefined}
      />
    </div>
  );
}
