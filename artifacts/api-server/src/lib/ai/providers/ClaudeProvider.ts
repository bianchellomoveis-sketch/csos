import type { AIProvider } from "../AIProvider";
import type { ClientAnalysisInput, ClientAnalysisResult } from "../types";

/**
 * Placeholder for a future real integration with Anthropic Claude. Not
 * implemented yet this sprint -- only the interface/wiring exists.
 */
export class ClaudeProvider implements AIProvider {
  async generateClientAnalysis(_input: ClientAnalysisInput): Promise<ClientAnalysisResult> {
    throw new Error("ClaudeProvider ainda não implementado. Configure a integração para ativá-lo.");
  }
}
