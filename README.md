# ClearNotice AI

## Current prototype

The workspace accepts pasted announcement text and prepares a local, keyword-based brief with source-linked quotations. It does not call Gemini, independently verify claims, persist notices, or record audit history. The included scholarship announcement is fictional demo content and is labeled in the interface.

The source document remains visible beside the findings on wide screens and moves above them on smaller screens. Evidence references link findings to exact quoted sentences; users can locate a passage from the source, brief, or ledger and copy citations.

### Routes

- `/` is the announcement workspace.
- `/source-document` shows the current source text and linked passages.
- `/analysis-brief` shows the prepared local prototype findings.
- `/evidence-ledger` lets users search and filter evidence and unknowns.
- `/welcome`, `/how-it-works`, `/sample-analysis`, and `/ready-to-begin` introduce the workflow. The sample is explicitly fictional.

Source text, analysis, and selected evidence are held in a shared in-memory provider. They remain available while navigating between routes, but are lost when the page is refreshed or closed. The sample analysis can be loaded into the workspace from its page.

## Development

- `npm run dev` starts the local development server.
- `npm run lint` runs ESLint.
- `npx tsc --noEmit` checks TypeScript.
- `npm run build` creates the production build.

There is no test runner configured in the current package. Interactive routes should be checked in a running browser at desktop and mobile widths before delivery.
