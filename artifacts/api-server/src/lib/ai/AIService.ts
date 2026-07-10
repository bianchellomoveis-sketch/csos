import type { AIProvider } from "./AIProvider";
import type { ClientAnalysisInput, ClientAnalysisResult } from "./types";
import { loadAIConfig } from "./config";
import { LocalAIProvider } from "./providers/LocalAIProvider";
import { OpenAIProvider } from "./providers/OpenAIProvider";
import { ClaudeProvider } from "./providers/ClaudeProvider";
import { GeminiProvider } from "./providers/GeminiProvider";
import { GroqProvider } from "./providers/GroqProvider";

const localProvider = new LocalAIProvider();

function resolveProvider(): AIProvider {
  const { provider } = loadAIConfig();
  switch (provider) {
    case "openai":
      return new OpenAIProvider();
    case "claude":
      return new ClaudeProvider();
    case "gemini":
      return new GeminiProvider();
    case "groq":
      return new GroqProvider();
    default:
      return localProvider;
  }
}

/**
 * Single entry point for ALL system intelligence. Every route that needs a
 * client analysis (score, priority, profile, message, strategy...) must call
 * this function -- never a provider directly. Swapping the AI backend later
 * is done exclusively in config.ts / providers, never here.
 */
export async function generateClientAnalysis(input: ClientAnalysisInput): Promise<ClientAnalysisResult> {
  const provider = resolveProvider();
  try {
    return await provider.generateClientAnalysis(input);
  } catch (err) {
    if (provider !== localProvider) {
      console.warn("[AIService] Provider configurado falhou ou não está implementado, usando LocalAIProvider como fallback.", err);
      return localProvider.generateClientAnalysis(input);
    }
    throw err;
  }
}
