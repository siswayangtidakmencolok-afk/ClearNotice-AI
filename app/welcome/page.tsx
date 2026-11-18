import Link from "next/link";
import type { Metadata } from "next";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { analyzePrototype, demoAnnouncement } from "@/components/workspace/demo-analysis";

export const metadata: Metadata = {
  title: "Welcome | ClearNotice AI",
  description: "An introduction to the ClearNotice AI announcement workspace.",
};

const sampleAnalysis = analyzePrototype(demoAnnouncement);
const sampleEvidence = sampleAnalysis.evidence[0];
const sampleParagraph = demoAnnouncement.split(/\n\s*\n/)[0];

export default function WelcomePage() {
  return (
    <OnboardingShell activePath="/welcome">
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto max-w-4xl py-5 text-center sm:py-10">
          <p className="font-mono text-xs font-semibold uppercase tracking-wide text-emerald-300">
            Announcement investigation workspace
          </p>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            Make every announcement easier to understand.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Read the original notice alongside its deadlines, requirements, actions, and the passages that support each finding.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            This prototype uses local keyword rules. It does not call Gemini, verify claims independently, or save notices after the page session.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded border border-emerald-400 bg-emerald-400 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200"
            >
              Start with a notice
            </Link>
            <Link
              href="/sample-analysis"
              className="inline-flex min-h-11 items-center justify-center rounded border border-slate-600 px-4 text-sm font-semibold text-slate-100 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
            >
              Review a labeled sample
            </Link>
          </div>
        </header>

        <section aria-label="Fictional source and candidate finding" className="overflow-hidden border border-slate-700 bg-[#060e20]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 bg-[#171f33] px-4 py-3 text-xs">
            <p className="font-mono font-semibold text-slate-100">Source-to-finding preview</p>
            <p className="font-semibold text-amber-200">Fictional example · local rules</p>
          </div>
          <div className="grid min-w-0 gap-4 p-4 sm:p-5 lg:grid-cols-2">
            <section className="min-w-0 border border-slate-700 bg-[#101b30] p-4" aria-labelledby="welcome-source-heading">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Primary source · Paragraph 01
              </p>
              <h2 id="welcome-source-heading" className="mt-2 font-serif text-lg font-semibold text-white">
                Fictional scholarship notice
              </h2>
              <p className="mt-3 break-words font-serif text-sm leading-7 text-slate-200">
                {sampleParagraph}
              </p>
            </section>

            <section className="min-w-0 border border-slate-700 bg-[#131b2e] p-4" aria-labelledby="welcome-finding-heading">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                  Candidate finding
                </p>
                <span className="rounded border border-amber-700 bg-amber-950 px-2 py-1 text-xs font-semibold text-amber-100">
                  Needs review
                </span>
              </div>
              <h2 id="welcome-finding-heading" className="mt-2 text-base font-semibold text-white">
                {sampleAnalysis.announcementType.detail}
              </h2>
              {sampleEvidence ? (
                <>
                  <p className="mt-3 font-mono text-xs text-slate-400">
                    {sampleEvidence.id} · Paragraph {sampleEvidence.paragraph}
                  </p>
                  <blockquote className="mt-2 break-words border-l-2 border-emerald-400 pl-3 font-serif text-sm leading-6 text-slate-200">
                    {sampleEvidence.quote}
                  </blockquote>
                </>
              ) : null}
              <p className="mt-4 border-t border-slate-700 pt-3 text-xs leading-5 text-slate-400">
                A text match identifies a passage in this example. It does not confirm the announcement independently.
              </p>
            </section>
          </div>
        </section>

        <div className="mt-5 grid gap-0 border-y border-slate-700 md:grid-cols-3 md:divide-x md:divide-slate-700">
          <section className="py-4 md:px-4 md:first:pl-0">
            <h2 className="text-sm font-semibold text-white">Evidence stays connected</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Follow a candidate finding to the passage it matched.
            </p>
          </section>
          <section className="border-t border-slate-700 py-4 md:border-t-0 md:px-4">
            <h2 className="text-sm font-semibold text-white">Deadlines retain source wording</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Review the original text instead of treating a normalized date as certain.
            </p>
          </section>
          <section className="border-t border-slate-700 py-4 md:border-t-0 md:px-4 md:pr-0">
            <h2 className="text-sm font-semibold text-white">Missing details stay unknown</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              The local prototype does not fill gaps with invented answers.
            </p>
          </section>
        </div>
      </div>
    </OnboardingShell>
  );
}
