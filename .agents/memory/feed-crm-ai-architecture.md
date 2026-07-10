---
name: Feed CRM AI architecture
description: How the Feed CRM assistant's intelligence is structured (AIService/AIProvider) and how to activate a real AI provider later.
---

All commercial intelligence (chance, risco, prioridade, urgência, estratégia, perfil inteligente, mensagem sugerida, raciocínio) is centralized behind a single function: `generateClientAnalysis()` in `artifacts/api-server/src/lib/ai/AIService.ts`. Routes never call a provider directly.

**Why:** the sprint requirement was "swap only the provider later, zero screen/route changes" when real AI (OpenAI/Claude/Gemini/Groq) gets added.

**How to apply:**
- Provider selection lives in `artifacts/api-server/src/lib/ai/config.ts`: reads `AI_PROVIDER` env var, or auto-detects from `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` / `GROQ_API_KEY`; defaults to `LocalAIProvider` when none set.
- Real provider stubs (`OpenAIProvider`, `ClaudeProvider`, `GeminiProvider`, `GroqProvider`) currently throw "not implemented"; `AIService` catches that and falls back to `LocalAIProvider` with a console warning, so setting a key prematurely never breaks the app.
- `LocalAIProvider` analyzes the *entire* interaction history (recurring objections, frequency/avg gap between contacts, sentiment evolution, days without contact) — not just the latest interaction.
- `analysisContext` (reasoning bullets) is stored as a JSON string column in Postgres but must always be serialized to `string[]` in API responses via the `serializeClient()` helper in `artifacts/api-server/src/routes/clients/index.ts` — every client-returning route must call it or the OpenAPI contract (array type) breaks.
