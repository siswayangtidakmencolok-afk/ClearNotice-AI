import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { ShieldCheck, Link2, Clock, Sparkles, ArrowRight, Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Welcome | ClearNotice AI",
  description: "Introduction to ClearNotice AI document intelligence and evidence verification.",
};

export default function WelcomePage() {
  return (
    <OnboardingShell activePath="/welcome">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* Top Protocol Metadata Strip (from Stitch onboarding.html) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-800 text-xs font-mono">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-semibold uppercase tracking-widest text-[10px]">
              ANNOUNCEMENT INTELLIGENCE & VERIFICATION
            </span>
          </div>
          <div className="text-slate-400 flex items-center gap-3">
            <span>SYS_PROTOCOL: V4.18-ONBOARD</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">ZERO-DRIFT VERIFIED</span>
          </div>
        </div>

        {/* Hero Editorial Header */}
        <header className="text-center max-w-3xl mx-auto space-y-4 pt-2">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-emerald-400">
            Understand announcements. Never miss what matters.
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
            Make Every Announcement Easier to Understand.
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Turn lengthy regulatory decrees, scholarship calls, and institutional notices into structured summaries, strict deadlines, eligibility rules, and traceable evidence citations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/how-it-works"
              className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs tracking-wider uppercase rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/sample-analysis"
              className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs tracking-wider uppercase rounded-lg border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Explore a Sample</span>
            </Link>
          </div>
        </header>

        {/* Visual Centerpiece (Onboarding reference image) */}
        <div className="relative rounded-2xl border border-slate-800 bg-[#060e20] overflow-hidden shadow-2xl">
          <div className="h-9 bg-[#131b2e] px-4 flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-white font-semibold">STREAM_INSPECTION_MODE: DUAL_PASS</span>
              <span className="hidden sm:inline bg-[#171f33] px-2 py-0.5 rounded text-blue-300">
                REF // AUDIT-DOC-98402
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-400 font-semibold">EVIDENCE ANCHORING ACTIVE</span>
            </div>
          </div>

          <div className="relative w-full aspect-[16/9] max-h-[520px] bg-slate-950 flex items-center justify-center overflow-hidden">
            <img
              src="/onboarding/welcome.png"
              alt="ClearNotice AI Transformation Canvas"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>

        {/* Three Value Proposition Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-6 rounded-xl bg-[#131b2e] border border-slate-800 hover:border-slate-700 transition-all space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-950/80 text-emerald-400 flex items-center justify-center border border-emerald-800/80">
              <Link2 size={20} />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 block font-semibold">
              PILLAR 01 // TRACEABILITY
            </span>
            <h2 className="text-lg font-bold text-white">Verbatim Evidence Anchors</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Zero hallucinations. Jump directly to the exact page, paragraph, and line item backing every extracted insight with single-click precision.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#131b2e] border border-slate-800 hover:border-slate-700 transition-all space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-950/80 text-amber-400 flex items-center justify-center border border-amber-800/80">
              <Clock size={20} />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-amber-400 block font-semibold">
              PILLAR 02 // DECISION IMPACT
            </span>
            <h2 className="text-lg font-bold text-white">Critical Cutoffs & Traps</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Instant synthesis of irreversible deadlines, required documentation stamps, and administrative disqualification rules.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#131b2e] border border-slate-800 hover:border-slate-700 transition-all space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-950/80 text-blue-400 flex items-center justify-center border border-blue-800/80">
              <Sparkles size={20} />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-blue-400 block font-semibold">
              PILLAR 03 // MULTI-PROVIDER AI
            </span>
            <h2 className="text-lg font-bold text-white">Gemini Reasoner + Fallback</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Powered by Google Gemini 3.8 Flash with controlled OpenRouter fallback and client-side encryption. Every finding is verified against the text.
            </p>
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}
