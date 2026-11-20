"use client";

import { useCallback, useEffect, useState } from "react";
import { WorkspaceShell } from "./workspace-shell";

type DocumentItem = { id: string; name: string; fileType: string; createdAt: string; chunkCount: number };
type Citation = { chunkId: string; quote: string; documentId?: string; documentName?: string; pageNumber?: number | null };

const fieldClass = "min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700";
const buttonClass = "inline-flex min-h-11 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60";

export function DocumentLibrary() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [consentToOpenRouter, setConsentToOpenRouter] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [answer, setAnswer] = useState<{ answer?: string; summary?: string; citations?: Citation[]; comparisons?: Array<{ topic: string; assessment: string; status: string; citations: Citation[] }>; provider?: string; modelId?: string } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/documents", { cache: "no-store" });
      const body = await response.json() as { documents?: DocumentItem[]; error?: string };
      if (!response.ok) throw new Error(body.error || "Document library is unavailable.");
      setDocuments(body.documents ?? []);
      setNotice("");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Document library is unavailable."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/documents", { cache: "no-store" }).then(async (response) => {
      const body = await response.json() as { documents?: DocumentItem[]; error?: string };
      if (!response.ok) throw new Error(body.error || "Document library is unavailable.");
      if (active) { setDocuments(body.documents ?? []); setNotice(""); }
    }).catch((error: unknown) => {
      if (active) setNotice(error instanceof Error ? error.message : "Document library is unavailable.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true); setNotice("");
    try {
      const form = new FormData(); form.set("file", file);
      const extractedResponse = await fetch("/api/extract", { method: "POST", body: form });
      const extracted = await extractedResponse.json() as { source?: string; paragraphPages?: Array<number | null>; fileName?: string; fileType?: string; error?: string };
      if (!extractedResponse.ok || !extracted.source || !extracted.fileName || !extracted.fileType) throw new Error(extracted.error || "The file could not be extracted.");
      const saveResponse = await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: extracted.fileName, fileType: extracted.fileType, source: extracted.source, paragraphPages: extracted.paragraphPages }) });
      const saved = await saveResponse.json() as { error?: string };
      if (!saveResponse.ok) throw new Error(saved.error || "The document could not be saved.");
      await refresh(); setNotice(`${extracted.fileName} was saved with a searchable text index.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Document upload failed."); }
    finally { setBusy(false); }
  };

  const submit = async (mode: "ask" | "compare") => {
    if (!consentToOpenRouter) {
      setNotice("Consent to OpenRouter processing is required before sending document passages for analysis.");
      setAnswer(null);
      return;
    }
    setBusy(true); setNotice(""); setAnswer(null);
    try {
      const response = await fetch(`/api/documents/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, documentIds: selected, consentToOpenRouter }), signal: AbortSignal.timeout(55_000) });
      const body = await response.json() as typeof answer & { error?: string };
      if (!response.ok) throw new Error(body.error || "The request could not be completed.");
      setAnswer(body);
    } catch (error) { setNotice(error instanceof Error ? error.message : "The request could not be completed."); }
    finally { setBusy(false); }
  };

  const citations = answer?.citations ?? answer?.comparisons?.flatMap((item) => item.citations) ?? [];
  return <WorkspaceShell>
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-300 bg-white p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Source collection</p>
        <h2 className="mt-2 font-serif text-2xl font-semibold text-slate-950">Ask across saved documents</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">Upload searchable PDF, DOCX, or TXT notices. Questions retrieve passages from this browser session; answers show only citations that match the saved source text exactly.</p>
        <label className="mt-5 flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-slate-400 px-4 text-sm font-medium text-slate-800 hover:bg-slate-50">
          <span>{busy ? "Working…" : "Add a document (PDF, DOCX, TXT; up to 4 MB)"}</span>
          <input className="sr-only" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" disabled={busy} onChange={(event) => { void upload(event.target.files?.[0]); event.currentTarget.value = ""; }} />
        </label>
      </section>
      <section className="rounded-xl border border-slate-300 bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h3 className="text-lg font-semibold text-slate-950">Saved in this session</h3><p className="mt-1 text-sm text-slate-700">Select one document for questions or two to ten for comparison.</p></div>
          <button className="min-h-10 rounded-md border border-slate-300 px-3 text-sm font-medium hover:bg-slate-50" onClick={() => void refresh()} type="button">Refresh</button>
        </div>
        {loading ? <p className="mt-4 text-sm text-slate-600" role="status">Loading documents…</p> : documents.length ? <ul className="mt-4 divide-y divide-slate-200">
          {documents.map((document) => <li className="flex items-center gap-3 py-3" key={document.id}><input aria-label={`Select ${document.name}`} checked={selected.includes(document.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, document.id] : current.filter((id) => id !== document.id))} type="checkbox" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{document.name}</p><p className="text-xs text-slate-600">{document.fileType} · {document.chunkCount} searchable passages</p></div></li>)}
        </ul> : <p className="mt-4 rounded-md bg-slate-50 px-3 py-4 text-sm text-slate-700">{notice || "No saved documents in this session yet."}</p>}
      </section>
      <section className="rounded-xl border border-slate-300 bg-white p-5 sm:p-7">
        <label className="block text-sm font-semibold text-slate-900" htmlFor="document-question">Question or comparison focus</label>
        <textarea id="document-question" className={`${fieldClass} mt-2 min-h-28 resize-y`} maxLength={1000} onChange={(event) => setQuestion(event.target.value)} placeholder="For example: What are the application deadlines and fees?" value={question} />
        <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-700"><input className="mt-1 size-4 shrink-0 accent-emerald-800" checked={consentToOpenRouter} onChange={(event) => setConsentToOpenRouter(event.target.checked)} type="checkbox" /><span>I consent to send the selected document passages to OpenRouter Free for analysis. If Cohere reranking is configured, it may also receive the question and retrieved passages. Do not enable this for sensitive documents unless you accept this third-party processing.</span></label>
        <div className="mt-3 flex flex-wrap gap-2"><button className={buttonClass} disabled={busy || !question.trim() || selected.length < 1} onClick={() => void submit("ask")} type="button">Ask selected documents</button><button className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50" disabled={busy || !question.trim() || selected.length < 2} onClick={() => void submit("compare")} type="button">Compare selection</button></div>
        {notice ? <p className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-950" role="status">{notice}</p> : null}
        {answer ? <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4" aria-live="polite"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">{answer.provider} · {answer.modelId}</p>{answer.answer ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-900">{answer.answer}</p> : <><p className="mt-3 text-sm leading-6 text-slate-900">{answer.summary}</p><ul className="mt-3 space-y-3">{answer.comparisons?.map((item, index) => <li className="rounded-md border border-slate-200 bg-white p-3" key={`${item.topic}-${index}`}><p className="text-sm font-semibold text-slate-900">{item.topic} · {item.status}</p><p className="mt-1 text-sm text-slate-800">{item.assessment}</p></li>)}</ul></>}
          {citations.length ? <div className="mt-4 border-t border-slate-200 pt-3"><h4 className="text-xs font-semibold uppercase tracking-wide text-slate-700">Verbatim evidence</h4><ul className="mt-2 space-y-2">{citations.map((citation, index) => <li className="text-sm leading-5 text-slate-800" key={`${citation.chunkId}-${index}`}><q>{citation.quote}</q><span className="ml-2 text-xs text-slate-600">{citation.documentName}{citation.pageNumber ? ` · p. ${citation.pageNumber}` : ""}</span></li>)}</ul></div> : null}
        </div> : null}
      </section>
    </div>
  </WorkspaceShell>;
}
