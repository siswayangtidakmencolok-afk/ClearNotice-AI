"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Copy, X } from "lucide-react";
import type { EvidenceAnchor } from "./types";

type EvidenceAuditDialogProps = {
  evidence: EvidenceAnchor[];
  onCopy: (quote: string, id: string) => void;
};

export function EvidenceAuditDialog({ evidence, onCopy }: EvidenceAuditDialogProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
        Review evidence references
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-slate-950/45" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded border border-slate-300 bg-white p-5 text-slate-900 shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700 sm:p-6">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <Dialog.Title className="text-lg font-semibold">Evidence references</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm leading-5 text-slate-600">
                Current source citations only. This prototype does not store a history of analysis events.
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="inline-flex size-11 shrink-0 items-center justify-center rounded text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              aria-label="Close evidence references"
            >
              <X size={18} aria-hidden="true" />
            </Dialog.Close>
          </div>
          {evidence.length ? (
            <ol className="mt-4 space-y-3">
              {evidence.map((anchor) => (
                <li key={anchor.id} className="border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-xs font-semibold text-slate-800">
                      {anchor.id} · Paragraph {anchor.paragraph}
                    </p>
                    <button
                      type="button"
                      onClick={() => onCopy(anchor.quote, anchor.id)}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                    >
                      <Copy size={14} aria-hidden="true" />
                      Copy citation
                    </button>
                  </div>
                  <blockquote className="mt-2 border-l-2 border-blue-700 pl-3 text-sm leading-6 text-slate-800">
                    {anchor.quote}
                  </blockquote>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 border border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-700" role="status">
              No source citations are available in this analysis yet.
            </p>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
