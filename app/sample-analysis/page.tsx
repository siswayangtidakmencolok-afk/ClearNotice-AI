import type { Metadata } from "next";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { SampleAnalysisPreview } from "@/components/onboarding/sample-analysis-preview";

export const metadata: Metadata = {
  title: "Sample Analysis | ClearNotice AI",
  description: "Review a clearly labeled fictional sample and local prototype output.",
};

export default function SampleAnalysisPage() {
  return (
    <OnboardingShell activePath="/sample-analysis">
      <header className="mb-7 max-w-3xl">
        <p className="text-sm font-semibold text-emerald-300">Demonstration only</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Sample analysis
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-300">
          Compare a fictional notice with the candidate findings and source passages produced by the current local prototype.
        </p>
      </header>
      <SampleAnalysisPreview />
    </OnboardingShell>
  );
}
