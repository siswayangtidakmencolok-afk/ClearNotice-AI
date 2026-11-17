import Link from "next/link";
import type { Metadata } from "next";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

export const metadata: Metadata = {
  title: "How It Works | ClearNotice AI",
  description: "Learn how the announcement workspace connects source text and findings.",
};

const steps = [
  {
    title: "Add the notice",
    detail: "Paste announcement text in the workspace. The prototype keeps it in page-session memory.",
  },
  {
    title: "Prepare a local brief",
    detail: "Simple keyword rules identify candidate dates, requirements, actions, and other passages. This is not a Gemini analysis.",
  },
  {
    title: "Open the evidence",
    detail: "Each source match can be followed from a finding to the corresponding text. A text match is not independent verification.",
  },
  {
    title: "Review what is missing",
    detail: "Fields without a matching passage are marked unknown so the prototype does not present them as established facts.",
  },
];

export default function HowItWorksPage() {
  return (
    <OnboardingShell activePath="/how-it-works">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold text-emerald-300">A source-first workflow</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Keep each conclusion close to its source.
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-300">
          The workspace is organized around reading and checking an announcement, not chatting with a general-purpose assistant.
        </p>
      </header>

      <ol className="mt-10 max-w-4xl divide-y divide-slate-700 border-y border-slate-700">
        {steps.map((step, index) => (
          <li key={step.title} className="grid gap-2 py-5 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-5 sm:py-6">
            <span className="font-mono text-sm font-semibold text-emerald-300">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">{step.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-7 max-w-3xl border-l-2 border-amber-400 pl-4 text-sm leading-6 text-amber-100">
        Prototype limitation: keyword matching can miss information or misclassify it. Always consult the original notice before taking action.
      </p>

      <Link
        href="/sample-analysis"
        className="mt-8 inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-500 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
      >
        Inspect the labeled sample
      </Link>
    </OnboardingShell>
  );
}
