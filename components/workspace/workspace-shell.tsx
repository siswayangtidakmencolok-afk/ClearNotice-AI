"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import {
  FileText,
  CalendarDays,
  Link2,
  Menu,
  X,
  Library,
  ShieldCheck,
  PlusCircle,
  ExternalLink,
  Sparkles,
  BookOpen,
  LayoutDashboard,
} from "lucide-react";
import { useAnnouncement } from "./announcement-provider";
import { EvidenceAuditDialog } from "./evidence-audit-dialog";

const navigation = [
  { href: "/", label: "Workspace", icon: LayoutDashboard },
  { href: "/analysis-brief", label: "Analysis Brief", icon: CalendarDays },
  { href: "/source-document", label: "Source Document", icon: FileText },
  { href: "/evidence-ledger", label: "Evidence Ledger", icon: Link2 },
  { href: "/documents", label: "Document Library", icon: Library },
  { href: "/welcome", label: "Onboarding Guide", icon: BookOpen },
];

const pageTitles: Record<string, string> = {
  "/": "Announcement Investigation Workspace",
  "/source-document": "Source Document Reader",
  "/analysis-brief": "Analysis Brief & Decision Dossier",
  "/evidence-ledger": "Forensic Evidence Ledger",
  "/documents": "Multi-Document Intelligence",
  "/welcome": "Onboarding & Walkthrough",
};

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const mobileNavigationId = useId();
  const title = pageTitles[pathname] ?? "Investigation Workspace";
  const { uploadedFile, startNewInvestigation, analysis } = useAnnouncement();

  const docTitle = uploadedFile?.name ?? (analysis?.overview?.subject || "National Student Innovation Grant 2026");

  return (
    <div className="min-h-screen bg-[#f2f3f5] text-[#1e293b] flex flex-col antialiased">
      <div className="min-h-screen lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] flex-1">
        {/* Desktop Sidebar (Stitch dark institutional theme #0b1120) */}
        <aside className="hidden border-r border-slate-800 bg-[#0b1120] text-slate-200 lg:flex lg:flex-col justify-between select-none">
          <div className="flex flex-col">
            {/* Header Brand */}
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center font-mono font-bold text-xs text-white tracking-tighter shadow-sm">
                  CN
                </div>
                <div className="flex flex-col leading-tight">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold tracking-tight text-white text-sm">ClearNotice</span>
                    <span className="font-mono text-[10px] text-blue-400 font-bold uppercase tracking-wider">AI</span>
                  </div>
                  <span className="text-[10px] text-slate-400 tracking-wide font-medium">Document Intelligence</span>
                </div>
              </Link>
            </div>

            {/* Navigation Group */}
            <div className="px-3 pt-4">
              <div className="px-3 pb-2 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Investigation Workspace
                </span>
              </div>
              <nav aria-label="Workspace navigation" className="space-y-1">
                {navigation.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex min-h-10 items-center justify-between rounded px-3 text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white shadow-xs font-semibold"
                          : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} className={isActive ? "text-white" : "text-slate-400"} aria-hidden="true" />
                        <span>{label}</span>
                      </div>
                      {href === "/analysis-brief" && analysis && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                          Verified
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Quick Action Button */}
            <div className="px-4 mt-5">
              <button
                type="button"
                onClick={startNewInvestigation}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                <PlusCircle size={14} className="text-blue-400" />
                <span>New Investigation</span>
              </button>
            </div>
          </div>

          {/* Sidebar Footer Status & Epistemic Notice */}
          <div className="p-4 border-t border-slate-800 bg-[#080d19] space-y-2.5">
            <div className="flex items-center gap-2 text-[11px] text-slate-300">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-emerald-400">
                Evidence-Anchored AI
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Every finding must map to an exact source passage. Findings without matching text are flagged as unknown.
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="min-w-0 flex flex-col">
          {/* Top Institutional Header */}
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
            <div className="mx-auto flex h-14 max-w-[1680px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              {/* Breadcrumb / Title Area */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="lg:hidden flex items-center gap-1.5 shrink-0">
                  <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center font-mono font-bold text-xs text-white">
                    CN
                  </div>
                </div>
                <nav className="flex items-center gap-1.5 text-xs text-slate-500 truncate" aria-label="Breadcrumb">
                  <Link href="/" className="hover:text-slate-900 transition-colors hidden sm:inline">
                    Workspace
                  </Link>
                  <span className="text-slate-300 hidden sm:inline">/</span>
                  <span className="text-slate-700 truncate max-w-[220px] font-medium hidden md:inline">
                    {docTitle}
                  </span>
                  <span className="text-slate-300 hidden md:inline">/</span>
                  <span className="text-slate-950 font-semibold truncate">{title}</span>
                </nav>
                <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  <span>Verified Ingestion</span>
                </div>
              </div>

              {/* Utility Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAuditOpen(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono transition-colors cursor-pointer"
                  title="Open Evidence Audit Log"
                >
                  <Sparkles size={13} className="text-blue-600" />
                  <span>Audit Trail</span>
                </button>
                <Link
                  href="/source-document"
                  className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                >
                  <FileText size={13} />
                  <span>View Source</span>
                </Link>
                <button
                  type="button"
                  aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
                  aria-expanded={mobileMenuOpen}
                  aria-controls={mobileNavigationId}
                  onClick={() => setMobileMenuOpen((open) => !open)}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 lg:hidden"
                >
                  {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
                </button>
              </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            <nav
              id={mobileNavigationId}
              aria-label="Mobile navigation"
              className={`${mobileMenuOpen ? "block" : "hidden"} border-t border-slate-200 bg-white px-4 py-2 lg:hidden space-y-1 shadow-md`}
            >
              {navigation.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={pathname === href ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex min-h-10 items-center gap-3 rounded px-3 text-xs font-medium ${
                    pathname === href ? "bg-blue-600 text-white font-semibold" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
            </nav>
          </header>

          {/* Main Body Viewport */}
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1680px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Audit Drawer Dialog */}
      <EvidenceAuditDialog open={auditOpen} onOpenChange={setAuditOpen} />
    </div>
  );
}
