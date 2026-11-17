import Link from "next/link";
import type { Metadata } from "next";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

export const metadata: Metadata = {
  title: "Ready to Begin | ClearNotice AI",
  description: "Open the ClearNotice AI workspace or review its demonstration.",
};

export default function ReadyToBeginPage() {
  return (
    <OnboardingShell activePath="/ready-to-begin">
      <section className="max-w-3xl border-y border-slate-700 py-8 sm:py-12">
        <p className="text-sm font-semibold text-emerald-300">Before you begin</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Bring a notice. Keep the original close.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
          Paste an announcement to prepare a source-linked prototype brief. You can compare the candidate findings with the notice and decide what needs checking.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
          The current prototype runs local keyword rules only. It does not use Gemini, store a notice, or record audit history.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-500 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
          >
            Open the workspace
          </Link>
          <Link
            href="/sample-analysis"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-600 px-4 text-sm font-semibold text-slate-100 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            Review the sample again
          </Link>
        </div>
      </section>
    </OnboardingShell>
  );
}
