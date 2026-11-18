"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { CalendarDays, ClipboardList, FileText, Link2, Menu, X } from "lucide-react";
import type { ReactNode } from "react";

const navigation = [
  { href: "/", label: "Workspace", icon: ClipboardList },
  { href: "/source-document", label: "Source document", icon: FileText },
  { href: "/analysis-brief", label: "Analysis brief", icon: CalendarDays },
  { href: "/evidence-ledger", label: "Evidence ledger", icon: Link2 },
];

const pageTitles: Record<string, string> = {
  "/": "Announcement investigation workspace",
  "/source-document": "Source document",
  "/analysis-brief": "Analysis brief",
  "/evidence-ledger": "Evidence ledger",
};

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileNavigationId = useId();
  const title = pageTitles[pathname] ?? "Announcement investigation workspace";

  return (
    <div className="min-h-screen bg-[#f2f3f5] text-[#1e293b]">
      <div className="min-h-screen lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-slate-800 bg-[#0b1120] text-slate-200 lg:flex lg:flex-col">
          <div className="border-b border-slate-800 px-5 py-4">
            <Link href="/" className="flex items-center gap-3 text-sm font-bold tracking-tight text-white">
              <span className="flex size-8 items-center justify-center rounded bg-blue-700 font-mono text-xs text-white" aria-hidden="true">
                CN
              </span>
              <span>
                ClearNotice AI
                <span className="mt-1 block text-xs font-normal text-slate-400">Announcement investigation</span>
              </span>
            </Link>
          </div>
          <nav aria-label="Workspace navigation" className="space-y-1 px-3 py-4">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
                  pathname === href
                    ? "bg-blue-700 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={17} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto border-t border-slate-800 px-5 py-4">
            <p className="text-xs leading-5 text-slate-400">
              Local prototype only. No Gemini request or audit history is active.
            </p>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
            <div className="mx-auto flex min-h-16 max-w-[1680px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-800 lg:hidden">ClearNotice AI</p>
                <h1 className="truncate font-serif text-base font-semibold text-slate-950 sm:text-lg">{title}</h1>
                <p className="hidden text-xs text-slate-600 sm:block">
                  Understand announcements. Never miss what matters.
                </p>
              </div>
              <button
                type="button"
                aria-label={mobileMenuOpen ? "Close workspace navigation" : "Open workspace navigation"}
                aria-expanded={mobileMenuOpen}
                aria-controls={mobileNavigationId}
                onClick={() => setMobileMenuOpen((open) => !open)}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 lg:hidden"
              >
                {mobileMenuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
              </button>
            </div>
            <nav
              id={mobileNavigationId}
              aria-label="Workspace navigation"
              className={`${mobileMenuOpen ? "block" : "hidden"} border-t border-slate-200 bg-white px-4 py-2 lg:hidden`}
            >
              {navigation.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={pathname === href ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex min-h-11 items-center gap-3 rounded px-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 ${
                    pathname === href
                      ? "bg-blue-50 text-blue-950"
                      : "text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </nav>
          </header>

          <main className="mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            {children}
          </main>
          <footer className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-600 sm:px-6">
            ClearNotice AI prototype. Review the original announcement before acting.
          </footer>
        </div>
      </div>
    </div>
  );
}
