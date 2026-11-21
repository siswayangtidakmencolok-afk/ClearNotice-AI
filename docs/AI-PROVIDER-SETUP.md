# ClearNotice AI: OpenRouter Free

OpenRouter Free is the only AI provider in the current analysis path. ClearNotice does not call Gemini for announcement analysis, Ask Your Documents, or Multi-Document Investigation. Existing Gemini code and local `GEMINI_API_KEY` settings are left intact but inactive in these routes.

The application sends source text to OpenRouter only when the user checks the consent box. OpenRouter receives the whole announcement for a brief, or the selected retrieved passages for document questions and comparisons. If Cohere reranking is configured, the document-intelligence consent notice also discloses that Cohere may receive the question and retrieved passages.

The default model is `openrouter/free`. The server accepts only that router or explicit model IDs ending in `:free`. The OpenRouter Free router chooses from currently available free models and filters for requested capabilities, including structured output. The actual response model is validated as free and shown in the UI. [OpenRouter Free model router](https://openrouter.ai/openrouter/free) · [Structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs).

## Configure the API key

1. Create an OpenRouter account and an API key from its [API key settings](https://openrouter.ai/settings/keys).
2. Open the local environment file yourself:

   ```powershell
   notepad .env.local
   ```

3. Add or update the following lines in Notepad, using your own key:

   ```dotenv
   OPENROUTER_API_KEY=your_key_here
   OPENROUTER_MODEL=openrouter/free
   ```

4. Save the file and restart Next.js.

Keep the key server-side. Never add it to browser code, paste it into chat, or commit `.env.local`. ClearNotice does not buy credits, enable auto-reload, or route to a paid model. OpenRouter documents the Free router at zero model price, but availability and free request limits can change; check its [free model list](https://openrouter.ai/collections/free-models) and [current pricing](https://openrouter.ai/pricing).

## Run in PowerShell

```powershell
npm run dev
```

Open `http://localhost:3000`. For live analysis, paste or upload a notice, check the OpenRouter consent box, and choose **Analyze announcement**. The result shows OpenRouter and the actual model ID. The JSON is parsed and validated against the app schema; evidence quotations that do not match the source are omitted.

The fictional sample uses local rules and is explicitly labeled. It is not a live AI analysis.

## Diagnose connectivity from Node

The server logs safe diagnostics only: request ID, model ID, request duration, provider HTTP status, error category/stage, and a sanitized error code when available. It does not log API keys, authorization headers, prompts, document passages, or response bodies.

The diagnostics distinguish DNS lookup (`network_dns`), refused connections (`network_refused`), TLS verification (`network_tls`), runtime/network permission blocks (`network_blocked`), timeout, and provider HTTP statuses such as 400, 401/403, 402, 404, 429, and 5xx. HTTP 402 is reported as a payment-required error; the app stops and does not purchase credits or try a paid model.

If the host requires an authorized proxy, set `HTTP_PROXY` and `HTTPS_PROXY` in the shell or managed runtime, then enable Node's environment proxy support before `npm run dev`:

```powershell
$env:NODE_USE_ENV_PROXY = "1"
npm run dev
```

Use only a trusted proxy configured by your network administrator. Do not disable TLS verification. Node.js 24 supports `NODE_USE_ENV_PROXY`; see the [Node.js CLI documentation](https://nodejs.org/download/release/v24.1.0/docs/api/cli.html#node_use_env_proxy1).

## Common errors

- **Configuration / key unavailable:** confirm the server process loaded `OPENROUTER_API_KEY`, then restart it. The key value is never needed in a log.
- **HTTP 401 or 403:** OpenRouter rejected authentication or permission.
- **HTTP 402:** OpenRouter reported a payment requirement. ClearNotice stays on free models and does not purchase credits.
- **HTTP 404:** the configured model or endpoint is not available.
- **HTTP 429:** a free request limit was reached; wait for the provider's limit window.
- **HTTP 5xx:** OpenRouter or the selected free inference endpoint returned a service error.
- **DNS/TLS/refused/blocked:** follow the `errorStage` and sanitized error code in the diagnostic; provider authentication was not reached for these failures.
- **Invalid or truncated JSON/schema:** the response is rejected with an actionable message; no sample analysis is substituted.
- **Consent required:** the API rejects the request before retrieval, reranking, or sending passages to OpenRouter.

## Provider endpoints

- [OpenRouter models endpoint](https://openrouter.ai/api/v1/models)
- [OpenRouter current API key status endpoint](https://openrouter.ai/docs/api/api-reference/api-keys/get-current-api-key)
- [OpenRouter Chat Completions](https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request)
- [OpenRouter structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs)
