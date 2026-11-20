# ClearNotice AI

ClearNotice turns announcement text into a structured brief with source-linked findings. Live analysis uses OpenRouter Free as its only AI provider. The workspace sends source text only after the user gives explicit consent. The separate fictional sample is labeled and uses local keyword rules; it is not a live provider result.

## Current capabilities

- Analyze pasted announcements up to 120,000 characters after OpenRouter consent.
- Extract PDF, DOCX, and TXT documents on the server before analysis; raw uploads are not sent to OpenRouter.
- Validate the provider's JSON against the ClearNotice Zod schema and discard quotations that do not exactly match a complete source sentence.
- Show the actual model returned by OpenRouter alongside the Investigation Brief and Evidence Ledger.
- Ask questions across saved documents and compare multiple notices, with source citations checked against retrieved text.
- Keep source text and analysis in page-session memory. There is no audit history or independent fact checking.

## Configure OpenRouter

1. Copy `.env.example` to `.env.local`, or open `.env.local` and add `OPENROUTER_API_KEY` without sharing the key or committing the file.
2. `OPENROUTER_MODEL` defaults to `openrouter/free`. The server accepts only that router or an explicitly suffixed `:free` model ID.
3. Restart the dev server after changing environment variables.

Gemini variables are retained for the existing integration but are not used by the current announcement, Ask Your Documents, or Multi-Document Investigation workflows. No paid model or credit-purchase path is enabled. See [the provider setup guide](docs/AI-PROVIDER-SETUP.md) for diagnostics and troubleshooting.

Document question and comparison requests also use Cohere reranking only if `COHERE_API_KEY` is configured. The consent notice explains that Cohere may receive the question and retrieved passages for this step.

## Run locally

From PowerShell in the project directory:

```powershell
npm run dev
```

Open `http://localhost:3000`.

If your network requires an authorized HTTP proxy, configure `HTTP_PROXY`/`HTTPS_PROXY` and set `NODE_USE_ENV_PROXY=1` before starting Node. Do not disable TLS certificate verification.

## Checks

- `npm run lint`
- `npx tsc --noEmit`
- `npm test`
- `npm run build`

`.nvmrc` selects Node.js 24. The PDF parser is externalized for Next.js so its worker module resolves at runtime; confirm the deployment adapter packages the PDF.js worker correctly before deploying.
