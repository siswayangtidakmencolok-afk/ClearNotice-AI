"use client";

import { useRouter } from "next/navigation";
import { useAnnouncement } from "@/components/workspace/announcement-provider";
import { canonicalNsigAnalysis, canonicalNsigAnnouncement } from "@/components/workspace/demo-analysis";
import { ArrowRight, Sparkles } from "lucide-react";

export function SampleAnalysisPreview() {
  const router = useRouter();
  const { copyMessage, copyText, loadCanonicalDemo } = useAnnouncement();
  const sampleExcerpts = canonicalNsigAnalysis.evidence.slice(0, 3);

  const loadSample = () => {
    loadCanonicalDemo();
    router.push("/analysis-brief");
  };

  return (
    <div className="space-y-6">
      {/* Reference Image Centerpiece */}
      <div className="rounded-xl border border-slate-800 bg-[#060e20] overflow-hidden shadow-xl">
        <div className="h-8 bg-[#131b2e] px-4 flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800">
          <span className="text-white font-semibold">LABELED DOSSIER WALKTHROUGH</span>
          <span className="text-emerald-400 font-semibold">CANONICAL NSIG 2026</span>
        </div>
        <div className="relative w-full aspect-[16/9] max-h-[460px] bg-slate-950 flex items-center justify-center overflow-hidden">
          <img
            src="/onboarding/first-analysis.png"
            alt="First Analysis Visual Reference"
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-[#131b2e] p-5 text-sm leading-relaxed text-slate-300">
        <strong className="text-white">Canonical Demonstration Dataset:</strong> This walkthrough illustrates how the MoECRT National Student Innovation Grant announcement is transformed into structured decisions, strict cutoffs, and bi-directionally verified evidence cards.
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(19rem,0.95fr)]">
        <section className="rounded-xl border border-slate-700 bg-[#101b30] p-6 text-slate-100">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald-400 block mb-2">
            Canonical Notice Text (Paragraphs 1-4)
          </span>
          <h2 className="text-base font-bold text-white mb-4">
            National Student Innovation Grant (NSIG) 2026
          </h2>
          <div className="space-y-4 font-serif text-xs leading-relaxed text-slate-300">
            {canonicalNsigAnnouncement.split(/\n\s*\n/).map((para, i) => (
              <p key={i} className="pl-3 border-l-2 border-slate-700">
                {para}
              </p>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-700 bg-[#131b2e] p-6 text-slate-100 space-y-4">
          <div>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-blue-400 block mb-1">
              Extracted Operative Brief
            </span>
            <h2 className="text-base font-bold text-white">
              {canonicalNsigAnalysis.overview?.subject}
            </h2>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              {canonicalNsigAnalysis.overview?.summary}
            </p>
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-2">
            <span className="font-mono text-xs font-bold uppercase text-amber-400 block">
              Critical Cutoffs
            </span>
            <ul className="space-y-2 text-xs">
              {canonicalNsigAnalysis.importantDates.map((item) => (
                <li key={item.id} className="p-2.5 rounded bg-[#171f33] border border-slate-700">
                  <span className="font-semibold text-white block">{item.label}</span>
                  <span className="text-slate-300">{item.detail}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-2">
            <span className="font-mono text-xs font-bold uppercase text-emerald-400 block">
              Bi-Directional Citations
            </span>
            <ul className="space-y-2 text-xs">
              {sampleExcerpts.map((item) => (
                <li key={item.id} className="p-2.5 rounded bg-[#171f33] border border-slate-700 space-y-1">
                  <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                    <span className="text-emerald-400 font-bold">[{item.id}]</span>
                    <span>Paragraph #{item.paragraph}</span>
                  </div>
                  <blockquote className="font-serif italic text-slate-300 leading-snug">
                    “{item.quote}”
                  </blockquote>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          onClick={loadSample}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wider uppercase rounded-lg shadow-xl flex items-center gap-2 transition-all cursor-pointer"
        >
          <span>Load Dossier into Workspace</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
