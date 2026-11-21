import Link from "next/link";
import type { Metadata } from "next";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { ArrowRight, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works | ClearNotice AI",
  description: "Learn how the ClearNotice AI document investigation workspace connects source text and evidence.",
};

const steps = [
  {
    title: "1. Ingest Announcement Corpus",
    detail:
      "Paste official text or upload PDF, DOCX, or TXT documents. Character normalization and structural tokenization execute securely on the server.",
  },
  {
    title: "2. Dual-Engine AI Extraction",
    detail:
      "Google Gemini reasoning extracts structured deadlines, eligibility criteria, and action items. Controlled OpenRouter fallback guarantees service availability.",
  },
  {
    title: "3. Forensic Evidence Anchoring",
    detail:
      "Every candidate assertion is validated against exact complete sentences in the source. Discarded citations and unsupported claims are placed into the Unknowns ledger.",
  },
  {
    title: "4. Synchronized Decision Dossier",
    detail:
      "Explore the interactive Analysis Brief and Evidence Ledger with bi-directional navigation between findings and source paragraphs.",
  },
];

export default function HowItWorksPage() {
  return (
    <OnboardingShell activePath="/how-it-works">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="max-w-3xl space-y-3">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
            A Source-First Document Workflow
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Keep Every Conclusion Anchored to Its Source.
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-slate-300">
            ClearNotice AI uses Google Gemini as its primary intelligence engine to parse complex notices, while preserving the original document as the single source of truth.
          </p>
        </header>

        {/* Visual Workflow Canvas */}
        <div className="rounded-xl border border-slate-800 bg-[#060e20] overflow-hidden shadow-xl">
          <div className="h-8 bg-[#131b2e] px-4 flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800">
            <span className="text-white font-semibold">FOUR-STAGE EVIDENCE PIPELINE</span>
            <span className="text-emerald-400">CANONICAL VERIFICATION PROTOCOL</span>
          </div>
          <div className="relative w-full aspect-[16/9] max-h-[460px] bg-slate-950 flex items-center justify-center overflow-hidden">
            <img
              src="/onboarding/how-it-works.png"
              alt="How ClearNotice AI Works"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>

        {/* 4 Process Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((step) => (
            <div key={step.title} className="p-5 rounded-xl bg-[#131b2e] border border-slate-800 space-y-2">
              <h2 className="text-base font-bold text-white font-mono">{step.title}</h2>
              <p className="text-xs text-slate-300 leading-relaxed">{step.detail}</p>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs leading-relaxed">
          <strong>Epistemic Warning:</strong> AI can misinterpret or miss implicit nuances. A text match proves that a clause was written in the notice, not that the issuer has independently authenticated it. Always verify with the issuing authority.
        </div>

        <div className="flex items-center gap-4 pt-2">
          <Link
            href="/sample-analysis"
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs tracking-wider uppercase rounded-lg shadow-lg flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Inspect the Sample</span>
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/"
            className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg transition-colors"
          >
            Go Directly to Workspace
          </Link>
        </div>
      </div>
    </OnboardingShell>
  );
}
