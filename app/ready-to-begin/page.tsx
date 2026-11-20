import Link from "next/link";
import type { Metadata } from "next";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Ready to Begin | ClearNotice AI",
  description: "Start analyzing announcements with ClearNotice AI.",
};

export default function ReadyToBeginPage() {
  return (
    <OnboardingShell activePath="/ready-to-begin">
      <div className="mx-auto max-w-4xl space-y-8 py-6">
        <header className="space-y-3">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
            Launch Your First Investigation
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Bring a Notice. Keep the Original Close.
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-slate-300 max-w-2xl">
            You are ready to ingest decrees, grants, or circulars. ClearNotice AI uses Google Gemini to generate structured briefs and anchors every claim back to the source text.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#131b2e] border border-slate-800 space-y-2">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <h3 className="font-semibold text-white text-sm">Supported Ingestion</h3>
            <p className="text-xs text-slate-400">
              Raw text paste, PDF with selectable text, DOCX, and TXT files up to 120,000 characters.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#131b2e] border border-slate-800 space-y-2">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <h3 className="font-semibold text-white text-sm">Dual-Provider Core</h3>
            <p className="text-xs text-slate-400">
              Google Gemini 3.8 Flash as primary reasoning model with automatic OpenRouter fallback.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#131b2e] border border-slate-800 space-y-2">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <h3 className="font-semibold text-white text-sm">Session Privacy</h3>
            <p className="text-xs text-slate-400">
              Investigation data is held client-side in browser memory with zero third-party data retention.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4">
          <Link
            href="/"
            className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wider uppercase rounded-lg shadow-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Open the Workspace</span>
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/sample-analysis"
            className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg border border-slate-700 transition-colors"
          >
            Inspect Sample Analysis
          </Link>
        </div>
      </div>
    </OnboardingShell>
  );
}
