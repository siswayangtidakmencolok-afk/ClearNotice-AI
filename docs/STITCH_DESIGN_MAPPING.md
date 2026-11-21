# Google Stitch Design References — Implementation Mapping

**Project:** ClearNotice AI  
**Repository:** ClearNotice-AI (`https://github.com/siswayangtidakmencolok-afk/ClearNotice-AI.git`)  
**Design Reference Directory:** `design-reference/`  
**Date:** November 2026

---

## 1. Overview

This document provides the formal visual-to-architectural mapping between the Google Stitch exported HTML design prototypes located in `design-reference/` and the actual Next.js (App Router), React 19, TypeScript, and Tailwind CSS pages and components of ClearNotice AI.

The Stitch HTML files serve as the visual source of truth for typography, layout hierarchy, component composition, state handling, and color palettes. ClearNotice AI implements these designs using native React/Tailwind components with live Gemini-driven document intelligence and persistent client-side investigation state.

---

## 2. Design-to-Route Mapping Table

| Reference HTML Filename | What the Reference Page Represents | Actual Next.js Route | Primary Components Reused / Created | Implementation Status |
| :--- | :--- | :--- | :--- | :--- |
| `workspace.html` | Dual-pane Investigation Workspace featuring Canonical Source Document reader on the left and Live Evidence Ledger & Decision Dossier on the right. Includes State Simulator (Investigation Mode, Empty State, Processing Pipeline, Error/Access Denied) and Evidence Audit Trail Drawer. | `/` (`app/page.tsx`) | `components/workspace/announcement-workspace.tsx`<br/>`components/workspace/source-panel.tsx`<br/>`components/workspace/workspace-shell.tsx`<br/>`components/workspace/evidence-audit-dialog.tsx` | IN PROGRESS (Upgrading to full Stitch visual specification) |
| `analysis-brief.html` | Comprehensive Executive Brief: Announcement Profile Strip, Executive Summary, Decision Framework, Important Dates & Milestones Timeline, Eligibility Criteria, Required Documents, Costs & Allocation, Action Plan Checklist, Warnings & Unknowns, and 2-column layout with quick-jump rail. | `/analysis-brief` (`app/analysis-brief/page.tsx`) | `components/workspace/analysis-brief.tsx`<br/>`components/workspace/workspace-shell.tsx` | IN PROGRESS (Transforming to Stitch editorial layout) |
| `evdence-ledger.html` | Dedicated Forensic Evidence Ledger: Epistemic Guardrail Protocol banner, Status Filter Pills (All Claims, Supported Matches, Needs Verification, Unknown/Omitted), Search filter, and Bi-directional Traceable Claim-to-Evidence Cards with exact verbatim quotes, paragraph/page anchors, and confidence ratings. | `/evidence-ledger` (`app/evidence-ledger/page.tsx`) | `components/workspace/evidence-ledger.tsx`<br/>`components/workspace/evidence-audit-dialog.tsx`<br/>`components/workspace/workspace-shell.tsx` | IN PROGRESS (Transforming to Stitch forensic card layout) |
| `source-documment.html` | Canonical Ingested Source Document: Official Letterhead Crest, Document Control Sub-Bar with Authority and Canonical Sync Badge, View Modes (Annotated Evidence vs. Clean Reader), Section Navigation Jump bar (#P1, #P2, etc.), In-document search with match counter, and Citation Anchor highlighting. | `/source-document` (`app/source-document/page.tsx`) | `components/workspace/source-document-page.tsx`<br/>`components/workspace/source-panel.tsx`<br/>`components/workspace/workspace-shell.tsx` | IN PROGRESS (Transforming to Stitch paper reader layout) |
| `onboarding.html`<br/>+ Reference Images (`Welcome CLearNotice AI.png`, `How it works.png`, `You First Analyst.png`) | Multi-step interactive product onboarding walkthrough: Welcome Hero with value proposition pillars, How It Works transformation flow, First Analysis / Sample exploration drawer, and Ready to Begin call-to-action. | `/welcome`<br/>`/how-it-works`<br/>`/sample-analysis`<br/>`/ready-to-begin` | `components/onboarding/onboarding-shell.tsx`<br/>`components/onboarding/sample-analysis-preview.tsx`<br/>`app/welcome/page.tsx`<br/>`app/how-it-works/page.tsx`<br/>`app/sample-analysis/page.tsx`<br/>`app/ready-to-begin/page.tsx` | IN PROGRESS (Aligning with Stitch dark HUD aesthetic and onboarding image assets) |

---

## 3. Design System & Typography Specification

### Color Palette Tokens (from Google Stitch)
- **Primary & Surface:**
  - Ink / Lead: `#0b1120`, `#0f172a`, `#191c1e`
  - Workspace Canvas: `#f2f3f5`, `#f7f9fb`
  - Paper / Parchment Reader: `#fbfaf6`, `#f9f8f4`, `#fcfcf9`
  - Border Hairlines: `#e2e0d8`, `#dcdad0`, `#cbd5e1`, `#e2e8f0`
- **Brand Accents:**
  - Royal Cobalt / Action Blue: `#0047bb`, `#0051d5`, `#2563eb`
  - Secondary Cobalt Fixed: `#dbe1ff`, `#003ea8`
  - Verified Emerald: `#047857`, `#059669`, `#10b981`, `#85f8c4`
  - Alert Amber / Caveat Notice: `#b45309`, `#d97706`, `#f59e0b`, `#fef3c7`
  - Crimson Warning / Paywall: `#b91c1c`, `#ba1a1a`, `#ffdad6`
- **Typography:**
  - Serif (Editorial Paper): `Newsreader`, `Georgia`, serif
  - Sans (Interface & Labels): `Inter`, `Geist`, system-ui, sans-serif
  - Monospace (Telemetry & Hashes): `JetBrains Mono`, `Geist Mono`, monospace

---

## 4. Architectural Integration Plan

1. **Shared Investigation State (`AnnouncementProvider`):**
   - Automatically persist active investigation and source text in `sessionStorage` / `localStorage` to guarantee persistence across route transitions and browser refreshes.
   - Seed default demonstration data when no document is loaded, preventing empty/broken UI states.
   - Provide an instant "New Investigation" action to safely reset state.

2. **Dual-Pane Workspace (`/`):**
   - Left pane: Canonical document reader with paragraph numbering `#P1`, `#P2`, ... and clickable highlight marks.
   - Right pane: Dual tabs for Evidence Ledger and Decision Dossier (critical timeline, risk radar, execution checklist).
   - Top toolstrip with active document metadata (Doc ID, SHA-256 hash, ingestion timestamp, verification status).
   - Mode switcher supporting active investigation, empty paste, processing pipeline progress, and error/blocked views.

3. **Multi-Provider AI Engine (`lib/ai/`):**
   - **Primary Engine:** Google Gemini (`gemini-3.8-flash` via `@google/genai` SDK) with JSON schema enforcement.
   - **Fallback Engine:** OpenRouter Free (`openrouter/free`) with automatic fallback upon recoverable Gemini errors.
   - **Telemetry:** Accurate attribution tags showing exact model, response latency, and verification confidence.
