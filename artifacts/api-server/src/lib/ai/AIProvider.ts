import type { ClientAnalysisInput, ClientAnalysisResult } from "./types";

/**
 * Contract every AI provider must implement. Swapping the active provider
 * (Local, OpenAI, Claude, Gemini, Groq) never requires touching routes,
 * screens or components -- only the provider selected in config.ts changes.
 */
export interface AIProvider {
  generateClientAnalysis(input: ClientAnalysisInput): Promise<ClientAnalysisResult>;
}
