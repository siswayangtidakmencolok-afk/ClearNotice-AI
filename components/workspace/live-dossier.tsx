"use client";

import { AlertTriangle, Clock, Languages, Link2, Mail, Phone, Search, Globe } from "lucide-react";
import type { ContactFinding, EvidenceAnchor, Finding, PrototypeAnalysis } from "./types";

type Props = {
  analysis: PrototypeAnalysis;
  activeEvidenceId: string | null;
  onJump: (evidenceId: string) => void;
};

const STATUS_CHIP: Record<Finding["status"], string> = {
  supported: "bg-emerald-50 text-emerald-800 border-emerald-200",
  "needs-verification": "bg-amber-50 text-amber-900 border-amber-200",
  unknown: "bg-slate-100 text-slate-600 border-slate-300",
};
const STATUS_LABEL: Record<Finding["status"], string> = {
  supported: "Source-stated",
  "needs-verification": "Verify",
  unknown: "Not found",
};

function JumpButton({ evidenceId, onJump }: { evidenceId?: string; onJump: (id: string) => void }) {
  if (!evidenceId) return null;
  return (
    <button
      type="button"
      onClick={() => onJump(evidenceId)}
      className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 flex items-center gap-1 cursor-pointer shrink-0"
    >
      <Search size={10} />
      <span>{evidenceId}</span>
    </button>
  );
}

function FindingRow({ item, onJump }: { item: Finding; onJump: (id: string) => void }) {
  return (
    <li className="flex items-start justify-between gap-2 p-2.5 bg-slate-50 rounded border border-slate-200">
      <div className="min-w-0">
        <span className="font-semibold text-slate-900 block">{item.label}</span>
        <span className="text-slate-700">{item.detail}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${STATUS_CHIP[item.status]}`}>
          {item.precision === "approximate" ? "Approximate" : STATUS_LABEL[item.status]}
        </span>
        <JumpButton evidenceId={item.evidenceId} onJump={onJump} />
      </div>
    </li>
  );
}

function Section({ title, items, empty, onJump }: { title: string; items: Finding[]; empty: string; onJump: (id: string) => void }) {
  const shown = items.filter((item) => item.status !== "unknown");
  return (
    <div className="bg-white border border-slate-300 rounded-lg p-4 space-y-3">
      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 block border-b border-slate-100 pb-2">
        {title}
      </span>
      {shown.length ? (
        <ul className="space-y-2 text-xs">{shown.map((item) => <FindingRow key={item.id} item={item} onJump={onJump} />)}</ul>
      ) : (
        <p className="text-xs text-slate-500 italic">{empty}</p>
      )}
    </div>
  );
}

function contactHref(contact: ContactFinding) {
  if (contact.type === "email" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.value)) return `mailto:${contact.value}`;
  if (contact.type === "phone") return `tel:${contact.value.replace(/[^\d+]/g, "")}`;
  if (/^https?:\/\//i.test(contact.value)) return contact.value;
  return undefined;
}

function ContactIcon({ type }: { type: ContactFinding["type"] }) {
  if (type === "email") return <Mail size={13} className="text-slate-500 shrink-0" />;
  if (type === "phone") return <Phone size={13} className="text-slate-500 shrink-0" />;
  return <Globe size={13} className="text-slate-500 shrink-0" />;
}

function EvidenceCard({ anchor, index, findings, active, onJump }: { anchor: EvidenceAnchor; index: number; findings: Finding[]; active: boolean; onJump: (id: string) => void }) {
  const verified = anchor.status === "supported";
  return (
    <div className={`bg-white border rounded-lg p-4 space-y-2.5 shadow-2xs transition-all ${active ? (verified ? "border-blue-600 ring-2 ring-blue-500/20" : "border-amber-500 ring-2 ring-amber-500/20") : verified ? "border-slate-200 hover:border-slate-300" : "border-amber-200 hover:border-amber-300"}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-xs font-mono font-bold text-white rounded ${verified ? "bg-blue-600" : "bg-amber-700"}`}>
            [{String(index + 1).padStart(2, "0")}]
          </span>
          <span className={`text-xs font-bold uppercase tracking-wide ${verified ? "text-slate-900" : "text-amber-950"}`}>
            {verified ? "VERIFIED SOURCE CLAIM" : "NEEDS VERIFICATION"}
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${verified ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-900 border-amber-200"}`}>
            {verified ? "Found in source" : "Approximate or unclear wording"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onJump(anchor.id)}
          className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 flex items-center gap-1 cursor-pointer"
        >
          <Search size={12} />
          <span>Jump to Passage</span>
        </button>
      </div>
      {findings.length > 0 && (
        <div>
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-0.5">Supports</span>
          <p className="text-xs font-medium text-slate-900 leading-relaxed">{findings.map((item) => item.label).join(" • ")}</p>
        </div>
      )}
      <div className={`p-3 rounded-r border space-y-1 border-l-4 ${verified ? "bg-[#fbfaf6] border-blue-600 border-[#e8e5d8]" : "bg-amber-50/40 border-amber-600 border-amber-200/80"}`}>
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>LOCATION: Paragraph {anchor.paragraph}{anchor.page ? ` • Page ${anchor.page}` : ""}</span>
          <span>{anchor.id}</span>
        </div>
        <blockquote className="font-serif italic text-xs text-slate-800 leading-relaxed">“{anchor.quote}”</blockquote>
      </div>
    </div>
  );
}

/** Decision dossier built only from the analysis of the document currently loaded. */
export function LiveDossier({ analysis, activeEvidenceId, onJump }: Props) {
  const overview = analysis.overview;
  const dates = analysis.importantDates.filter((item) => item.status !== "unknown");
  const deadline = dates.find((item) => /deadline|close|closing|due|batas|penutupan/i.test(item.label));
  const contacts = analysis.contacts ?? [];
  const steps = [...analysis.actionItems, ...(analysis.nextSteps ?? [])].filter((item) => item.status !== "unknown");
  const uniqueSteps = steps.filter((item, index) => steps.findIndex((other) => other.detail.toLowerCase() === item.detail.toLowerCase()) === index);
  const allFindings = [
    analysis.announcementType, overview?.organizer, overview?.location, ...(analysis.keyFacts ?? []), ...analysis.importantDates,
    ...analysis.eligibility, ...analysis.requirements, ...(analysis.benefits ?? []), ...analysis.costsAndFees,
    ...analysis.actionItems, ...analysis.warnings, ...(analysis.nextSteps ?? []),
  ].filter((item): item is Finding => Boolean(item));
  const translation = analysis.translation;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
      {/* OVERVIEW */}
      <div className="bg-white border border-slate-300 rounded-lg p-4 space-y-3">
        <div className="border-b border-slate-100 pb-2">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">{overview?.category || analysis.announcementType.detail}</span>
          <h2 className="font-serif font-bold text-lg text-slate-900 leading-snug">{overview?.subject}</h2>
        </div>
        <p className="text-xs text-slate-800 leading-relaxed">{overview?.summary}</p>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {[
            { label: "Organizer", item: overview?.organizer },
            { label: "Location", item: overview?.location },
            { label: "Audience", item: overview?.audience ? { id: "audience", label: "Audience", detail: overview.audience, status: "needs-verification" as const } : undefined },
          ].map(({ label, item }) => (
            <div key={label} className="p-2.5 bg-slate-50 rounded border border-slate-200">
              <dt className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between gap-1">
                <span>{label}</span>
                <JumpButton evidenceId={item?.evidenceId} onJump={onJump} />
              </dt>
              <dd className={`mt-0.5 ${item && item.status !== "unknown" ? "text-slate-900 font-medium" : "text-slate-500 italic"}`}>
                {item && item.status !== "unknown" ? item.detail : "Not stated in the source."}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* INDONESIAN TRANSLATION */}
      {translation?.needed && (translation.summary || translation.keyPoints.length > 0) && (
        <div className="bg-white border border-blue-200 rounded-lg p-4 space-y-2" lang="id">
          <div className="flex items-center justify-between gap-2 border-b border-blue-100 pb-2 flex-wrap">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-900 flex items-center gap-2">
              <Languages size={14} className="text-blue-600" />
              <span>Terjemahan Bahasa Indonesia</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">Dari {translation.sourceLanguage} • terjemahan AI, rujuk kutipan sumber</span>
          </div>
          {translation.summary && <p className="text-xs text-slate-800 leading-relaxed">{translation.summary}</p>}
          {translation.keyPoints.length > 0 && (
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-800">
              {translation.keyPoints.map((point, index) => <li key={index}>{point}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* CRITICAL TIMELINE */}
      <div className="bg-[#0f172a] text-slate-100 rounded-xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span className="font-mono text-xs uppercase tracking-widest text-amber-400 font-bold">Timeline & Deadlines</span>
          </div>
          {deadline && (
            <span className="bg-amber-400 text-slate-950 font-bold px-2.5 py-0.5 rounded text-xs font-mono">{deadline.detail}</span>
          )}
        </div>
        {dates.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800 text-xs">
            {dates.map((date, index) => (
              <button
                type="button"
                key={date.id}
                onClick={() => date.evidenceId && onJump(date.evidenceId)}
                className={`text-left p-3 rounded border cursor-pointer ${date === deadline ? "bg-amber-950/60 border-amber-600/60" : "bg-slate-900/80 border-slate-800"}`}
              >
                <span className="text-[10px] font-mono text-slate-400 block uppercase">{index + 1}. {date.label.split(":")[0]}</span>
                <span className="font-semibold text-white block mt-0.5">{date.detail}</span>
                <span className={`text-[10px] font-mono ${date.precision === "approximate" ? "text-amber-300" : "text-emerald-400"}`}>
                  {date.precision === "approximate" ? "Approximate date — confirm with organizer" : "Exact date stated"}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 pt-1 border-t border-slate-800">No dates were found in the source.</p>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Section title="Eligibility (Who can apply)" items={analysis.eligibility} empty="Eligibility was not stated in the source." onJump={onJump} />
        <Section title="Requirements & Documents" items={analysis.requirements} empty="Requirements were not stated in the source." onJump={onJump} />
        <Section title="Benefits" items={analysis.benefits ?? []} empty="Benefits were not stated in the source." onJump={onJump} />
        <Section title="Costs & Fees" items={analysis.costsAndFees} empty="Costs were not stated in the source." onJump={onJump} />
      </div>

      {/* REGISTRATION LINKS & CONTACTS */}
      <div className="bg-white border border-slate-300 rounded-lg p-4 space-y-3">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 block border-b border-slate-100 pb-2">
          Registration Links & Official Contacts
        </span>
        {contacts.length ? (
          <ul className="space-y-2 text-xs">
            {contacts.map((contact) => {
              const href = contactHref(contact);
              return (
                <li key={contact.id} className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <ContactIcon type={contact.type} />
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">
                        {contact.type === "registration_url" ? "Registration link" : contact.label}
                      </span>
                      {href ? (
                        <a href={href} target={contact.type === "email" || contact.type === "phone" ? undefined : "_blank"} rel="noreferrer noopener" className="text-blue-700 underline break-all">{contact.value}</a>
                      ) : (
                        <span className="text-slate-900 break-all">{contact.value}</span>
                      )}
                    </div>
                  </div>
                  <JumpButton evidenceId={contact.evidenceId} onJump={onJump} />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-slate-500 italic">No registration link, email, or phone number is written in the source.</p>
        )}
      </div>

      {/* RISK RADAR */}
      {analysis.warnings.length > 0 && (
        <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-mono text-xs font-bold uppercase tracking-wider">
            <AlertTriangle size={15} className="text-amber-700" />
            <span>Risk Radar & Disqualification Traps</span>
          </div>
          <ul className="space-y-1.5 text-xs text-amber-950">
            {analysis.warnings.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-2">
                <span><strong>{item.label}:</strong> {item.detail}</span>
                <JumpButton evidenceId={item.evidenceId} onJump={onJump} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* UNKNOWN / MISSING */}
      <div className="p-4 bg-slate-100 border border-slate-300 rounded-lg space-y-2">
        <div className="flex items-center gap-2 text-slate-800 font-mono text-xs font-bold uppercase tracking-wider">
          <Clock size={15} className="text-slate-600" />
          <span>Unknown / Missing Details in Notice</span>
        </div>
        {analysis.unknowns.length ? (
          <ul className="space-y-1 text-xs text-slate-700">
            {analysis.unknowns.map((item) => <li key={item.id}><strong>{item.label}:</strong> {item.detail}</li>)}
          </ul>
        ) : (
          <p className="text-xs text-slate-600">No missing details were reported.</p>
        )}
      </div>

      {/* EXECUTION PLAN */}
      <div className="bg-white border border-slate-300 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">How to Apply (Steps Stated in the Notice)</span>
        </div>
        {uniqueSteps.length ? (
          <div className="space-y-2 text-xs">
            {uniqueSteps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="w-5 h-5 rounded bg-blue-600 text-white font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-slate-800">{step.detail}</span>
                </div>
                <JumpButton evidenceId={step.evidenceId} onJump={onJump} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">The notice does not describe how to apply.</p>
        )}
      </div>

      {/* EVIDENCE LEDGER */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Link2 size={15} className="text-blue-600" />
          <span>Evidence Ledger ({analysis.evidence.length} source quotes)</span>
        </h2>
        {analysis.evidence.map((anchor, index) => (
          <EvidenceCard
            key={anchor.id}
            anchor={anchor}
            index={index}
            findings={allFindings.filter((item) => item.evidenceId === anchor.id)}
            active={activeEvidenceId === anchor.id}
            onJump={onJump}
          />
        ))}
      </div>
    </div>
  );
}
