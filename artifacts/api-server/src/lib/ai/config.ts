/**
 * Central AI configuration. Set AI_PROVIDER to force a provider, or leave it
 * unset ("auto") so the system picks the first provider with a valid API key
 * -- falling back to LocalAIProvider when none is set.
 *
 * To activate a real provider, set the matching secret:
 *   OPENAI_API_KEY, ANTHROPIC_API_KEY (Claude), GEMINI_API_KEY, GROQ_API_KEY
 * Use Replit's Secrets tool to add them -- never hardcode keys in code.
 */
export type AIProviderName = "local" | "openai" | "claude" | "gemini" | "groq";

export interface AIConfig {
  provider: AIProviderName;
  openaiApiKey: string;
  anthropicApiKey: string;
  geminiApiKey: string;
  groqApiKey: string;
}

export function loadAIConfig(): AIConfig {
  const explicit = (process.env.AI_PROVIDER || "").toLowerCase().trim();
  const openaiApiKey = process.env.OPENAI_API_KEY || "";
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY || "";
  const geminiApiKey = process.env.GEMINI_API_KEY || "";
  const groqApiKey = process.env.GROQ_API_KEY || "";

  let provider: AIProviderName = "local";

  if (explicit === "openai" || explicit === "claude" || explicit === "gemini" || explicit === "groq" || explicit === "local") {
    provider = explicit;
  } else if (openaiApiKey) {
    provider = "openai";
  } else if (anthropicApiKey) {
    provider = "claude";
  } else if (geminiApiKey) {
    provider = "gemini";
  } else if (groqApiKey) {
    provider = "groq";
  }

  return { provider, openaiApiKey, anthropicApiKey, geminiApiKey, groqApiKey };
}
