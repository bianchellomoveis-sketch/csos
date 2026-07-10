import type { AIProvider } from "../AIProvider";
import type { ClientAnalysisInput, ClientAnalysisResult } from "../types";

/**
 * Placeholder for a future real integration with Google Gemini. Not
 * implemented yet this sprint -- only the interface/wiring exists.
 */
export class GeminiProvider implements AIProvider {
  async generateClientAnalysis(_input: ClientAnalysisInput): Promise<ClientAnalysisResult> {
    throw new Error("GeminiProvider ainda não implementado. Configure a integração para ativá-lo.");
  }
}
