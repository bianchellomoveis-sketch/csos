import type { AIProvider } from "../AIProvider";
import type { ClientAnalysisInput, ClientAnalysisResult } from "../types";

/**
 * Placeholder for a future real integration with OpenAI. Not implemented yet
 * this sprint -- only the interface/wiring exists so activating it later is
 * just implementing this method, with zero changes elsewhere in the app.
 */
export class OpenAIProvider implements AIProvider {
  async generateClientAnalysis(_input: ClientAnalysisInput): Promise<ClientAnalysisResult> {
    throw new Error("OpenAIProvider ainda não implementado. Configure a integração para ativá-lo.");
  }
}
