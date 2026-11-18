import Link from "next/link";
import type { ReactNode } from "react";

const steps = [
  { href: "/welcome", label: "Welcome" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/sample-analysis", label: "First Analysis" },
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
    <div className="min-h-screen bg-[#05080f] text-[#dae2fd]">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#05080f]">
        <div className="mx-auto flex min-h-16 max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/welcome" className="flex min-h-11 shrink-0 items-center gap-2 text-sm font-semibold tracking-tight text-white">
            <span className="flex size-8 items-center justify-center border border-slate-700 bg-[#171f33] font-mono text-xs text-emerald-300" aria-hidden="true">
              CN
            </span>
            ClearNotice <span className="text-emerald-300">AI</span>
          </Link>
          <nav
            aria-label="Getting started"
            className="order-3 flex w-full min-w-0 items-center gap-1 overflow-x-auto md:order-none md:w-auto"
          >
            {steps.map((step, index) => (
              <Link
                key={step.href}
                href={step.href}
                aria-current={activePath === step.href ? "step" : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center rounded px-2 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 sm:px-3 sm:text-sm ${
                  activePath === step.href
                    ? "bg-emerald-500 text-[#05080f]"
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
            className="inline-flex min-h-11 shrink-0 items-center text-xs font-medium text-slate-300 underline-offset-4 hover:text-white hover:underline sm:text-sm"
          >
            Skip to workspace
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <footer className="border-t border-slate-800 px-4 py-5 text-center text-xs text-slate-400">
        ClearNotice AI introduction. Sample content is labeled and not an official notice.
      </footer>
    </div>
  );
}
