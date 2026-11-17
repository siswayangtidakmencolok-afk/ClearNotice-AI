import Link from "next/link";
import type { ReactNode } from "react";

const steps = [
  { href: "/welcome", label: "Welcome" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/sample-analysis", label: "Sample Analysis" },
  { href: "/ready-to-begin", label: "Ready to Begin" },
];

export function OnboardingShell({
  children,
  activePath,
}: {
  children: ReactNode;
  activePath: string;
}) {
  return (
    <div className="min-h-screen bg-[#0b1326] text-slate-100">
      <header className="border-b border-slate-800 bg-[#080d19]">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/welcome" className="shrink-0 text-sm font-semibold tracking-tight text-white">
            ClearNotice <span className="text-emerald-400">AI</span>
          </Link>
          <nav aria-label="Getting started" className="flex max-w-full flex-wrap items-center gap-1">
            {steps.map((step, index) => (
              <Link
                key={step.href}
                href={step.href}
                aria-current={activePath === step.href ? "step" : undefined}
                className={`inline-flex min-h-11 items-center rounded-md px-2 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 sm:px-3 sm:text-sm ${
                  activePath === step.href
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="mr-1 text-slate-400">{index + 1}.</span>
                {step.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-xs font-medium text-slate-300 underline-offset-4 hover:text-white hover:underline sm:text-sm"
          >
            Skip to workspace
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>
      <footer className="border-t border-slate-800 px-4 py-5 text-center text-xs text-slate-400">
        ClearNotice AI introduction. Sample content is labeled and not an official notice.
      </footer>
    </div>
  );
}
