import Link from "next/link";
import type { Metadata } from "next";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

export const metadata: Metadata = {
  title: "Welcome | ClearNotice AI",
  description: "An introduction to the ClearNotice AI announcement workspace.",
};

export default function WelcomePage() {
  return (
    <OnboardingShell activePath="/welcome">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)] lg:items-center">
        <section className="max-w-3xl py-3 sm:py-8">
          <p className="text-sm font-semibold text-emerald-300">Announcement investigation workspace</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            Understand announcements. Never miss what matters.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Read the original notice alongside its deadlines, requirements, actions, and the exact passages those findings came from.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
            This prototype uses local keyword rules. It does not call Gemini, verify claims, or save notices after the page session.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-500 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              Start with a notice
            </Link>
            <Link
              href="/sample-analysis"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-600 px-4 text-sm font-semibold text-slate-100 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
            >
              Review a labeled sample
            </Link>
          </div>
        </section>

        <aside className="border-y border-slate-700 py-6 lg:border-l lg:border-y-0 lg:pl-7">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            What the workspace keeps connected
          </p>
          <ol className="mt-4 divide-y divide-slate-800">
            <li className="py-4">
              <p className="text-sm font-semibold text-white">The original source</p>
              <p className="mt-1 text-sm leading-6 text-slate-400">Read the notice as provided, not as a replacement summary.</p>
            </li>
            <li className="py-4">
              <p className="text-sm font-semibold text-white">Findings and evidence</p>
              <p className="mt-1 text-sm leading-6 text-slate-400">Follow each cited passage back to its place in the source.</p>
            </li>
            <li className="py-4">
              <p className="text-sm font-semibold text-white">Unclear information</p>
              <p className="mt-1 text-sm leading-6 text-slate-400">See what the local prototype did not identify, instead of filling gaps with guesses.</p>
            </li>
          </ol>
        </aside>
      </div>
    </OnboardingShell>
  );
}
