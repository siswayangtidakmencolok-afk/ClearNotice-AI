"use client";

import { useRouter } from "next/navigation";
import { useAnnouncement } from "@/components/workspace/announcement-provider";
import { analyzePrototype, demoAnnouncement } from "@/components/workspace/demo-analysis";

const sampleAnalysis = analyzePrototype(demoAnnouncement);

export function SampleAnalysisPreview() {
  const router = useRouter();
  const { copyMessage, copyText, loadDemoAndAnalyze } = useAnnouncement();
  const sampleExcerpts = sampleAnalysis.evidence.slice(0, 3);

  const loadSample = () => {
    loadDemoAndAnalyze();
    router.push("/analysis-brief");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <strong className="font-semibold">Fictional demonstration.</strong> This sample is analyzed with
        local keyword rules. It is not a real announcement, a Gemini result, or an external verification.
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(19rem,0.95fr)]">
        <section className="rounded-xl border border-slate-700 bg-[#101b30] p-5 text-slate-100 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Fictional source text</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Scholarship announcement</h2>
          <p className="mt-4 whitespace-pre-line break-words text-sm leading-7 text-slate-200">
            {demoAnnouncement}
          </p>
        </section>

        <section className="rounded-xl border border-slate-300 bg-white p-5 sm:p-6" aria-labelledby="sample-brief-heading">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Local prototype output</p>
          <h2 id="sample-brief-heading" className="mt-2 text-lg font-semibold text-slate-950">
            {sampleAnalysis.announcementType.detail}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Candidate details are copied from matching sentences. Review each passage in the source before acting.
          </p>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-950">Deadline mentions</h3>
            <ul className="mt-2 space-y-3">
              {sampleAnalysis.importantDates.map((item) => (
                <li key={item.id} className="border-l-2 border-amber-600 pl-3">
                  <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                  <p className="mt-1 break-words text-sm leading-6 text-slate-700">{item.detail}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-950">Source passages</h3>
            <ul className="mt-3 space-y-3">
              {sampleExcerpts.map((item) => (
                <li key={item.id} className="rounded-md bg-slate-50 p-3">
                  <p className="font-mono text-xs font-semibold text-emerald-900">{item.id}</p>
                  <blockquote className="mt-2 break-words text-sm leading-6 text-slate-800">
                    {item.quote}
                  </blockquote>
                  <button
                    type="button"
                    onClick={() => void copyText(item.quote, item.id)}
                    className="mt-2 inline-flex min-h-11 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                  >
                    Copy citation
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {sampleAnalysis.unknowns.length ? (
            <div className="mt-5 border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-950">Not found in this text</h3>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                {sampleAnalysis.unknowns.map((item) => (
                  <li key={item.id}>
                    <span className="font-medium text-slate-900">{item.label}:</span> {item.detail}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>

      {copyMessage ? <p className="text-sm text-slate-700" role="status">{copyMessage}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={loadSample}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          Load sample into workspace
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-400 bg-transparent px-4 text-sm font-semibold text-slate-100 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
        >
          Use my own notice
        </button>
      </div>
    </div>
  );
}
