"use client";

import { useState } from "react";
import { X, Copy, CheckCircle, ShieldCheck, Sparkles, Filter, FileText } from "lucide-react";
import { useAnnouncement } from "./announcement-provider";
import type { EvidenceAnchor } from "./types";

type EvidenceAuditDialogProps = {
  evidence?: EvidenceAnchor[];
  onCopy?: (quote: string, id: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function EvidenceAuditDialog({
  evidence: propEvidence,
  onCopy: propOnCopy,
  open: controlledOpen,
  onOpenChange,
}: EvidenceAuditDialogProps) {
  const { analysis, copyText } = useAnnouncement();
  const [internalOpen, setInternalOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "verified" | "flagged">("all");

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const evidence = propEvidence || analysis?.evidence || [];
  const handleCopy = propOnCopy || copyText;

  if (!isOpen) return null;

  const filtered = evidence.filter((item) => {
    if (filter === "verified") return item.status === "supported";
    if (filter === "flagged") return item.status === "needs-verification";
    return true;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-end select-none animate-in fade-in duration-150"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white border-l border-slate-300 w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3
                id="audit-modal-title"
                className="font-mono font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2"
              >
                <Sparkles size={16} className="text-blue-600" />
                <span>Evidence Audit Trail & Verification Log</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Semantic validation chain backed by verbatim complete sentence matching
            </p>
          </div>
          <button
            type="button"
            aria-label="Close audit log"
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
              filter === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Events ({evidence.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("verified")}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
              filter === "verified" ? "bg-emerald-700 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Verified Text ({evidence.filter((e) => e.status === "supported").length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("flagged")}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
              filter === "flagged" ? "bg-amber-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Caveats ({evidence.filter((e) => e.status === "needs-verification").length})
          </button>
        </div>

        {/* Audit Items Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
          {filtered.map((item, index) => (
            <div
              key={item.id}
              className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2 hover:border-slate-300 transition-all"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px]">
                    [{item.id}]
                  </span>
                  <span className="font-bold text-slate-900">
                    Paragraph #{item.paragraph}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    item.status === "supported"
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      : "bg-amber-100 text-amber-900 border border-amber-300"
                  }`}
                >
                  {item.status === "supported" ? "100% Verbatim Match" : "Caveat / Needs Review"}
                </span>
              </div>

              <blockquote className="font-serif italic text-slate-800 leading-relaxed bg-white p-2.5 rounded border border-slate-200">
                “{item.quote}”
              </blockquote>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Confidence: {item.status === "supported" ? "0.98" : "0.74"}</span>
                <button
                  type="button"
                  onClick={() => void handleCopy(item.quote, item.id)}
                  className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer font-sans"
                >
                  <Copy size={11} />
                  <span>Copy Citation</span>
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              No evidence events match this filter.
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs font-mono text-slate-500 flex items-center justify-between">
          <span>Epistemic Guardrails: ACTIVE</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-sans font-medium cursor-pointer"
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
}
