import type { AIProvider } from "./AIProvider";
import type { ClientAnalysisInput, ClientAnalysisResult } from "./types";

/**
 * Central orchestration entry point for cognitive client analysis.
 *
 * Coordinates the primary cognitive provider and an optional fallback
 * without exposing provider details to routes or frontend components.
 */
export class SalesBrainCore {
  constructor(
    private readonly primaryProvider: AIProvider,
    private readonly fallbackProvider?: AIProvider,
  ) {}

  async analyzeClient(
    input: ClientAnalysisInput,
  ): Promise<ClientAnalysisResult> {
    const primaryProviderName = this.primaryProvider.constructor.name;

    try {
      const result = await this.primaryProvider.generateClientAnalysis(input);

      console.info(
        `[SalesBrainCore] Analysis completed with ${primaryProviderName}.`,
      );

      return result;
    } catch (error) {
      if (
        this.fallbackProvider &&
        this.fallbackProvider !== this.primaryProvider
      ) {
        const fallbackProviderName = this.fallbackProvider.constructor.name;

        console.warn(
          `[SalesBrainCore] ${primaryProviderName} failed. Using ${fallbackProviderName}.`,
        );

        const result =
          await this.fallbackProvider.generateClientAnalysis(input);

        console.info(
          `[SalesBrainCore] Analysis completed with ${fallbackProviderName}.`,
        );

        return result;
      }

      console.error(
        `[SalesBrainCore] ${primaryProviderName} failed without fallback.`,
      );

      throw error;
    }
  }
}
