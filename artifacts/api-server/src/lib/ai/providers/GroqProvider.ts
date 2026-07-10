import type { AIProvider } from "../AIProvider";
import type { ClientAnalysisInput, ClientAnalysisResult } from "../types";

/**
 * Placeholder for a future real integration with Groq. Not implemented yet
 * this sprint -- only the interface/wiring exists.
 */
export class GroqProvider implements AIProvider {
  async generateClientAnalysis(_input: ClientAnalysisInput): Promise<ClientAnalysisResult> {
    throw new Error("GroqProvider ainda não implementado. Configure a integração para ativá-lo.");
  }
}
