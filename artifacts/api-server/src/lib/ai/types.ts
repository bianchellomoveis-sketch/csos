import type { Client, Interaction } from "@workspace/db";

/** Everything the AI needs to reason about a client: full record + entire interaction history. */
export interface ClientAnalysisInput {
  client: Client;
  interactions: Interaction[];
}

/** Output contract every provider (local or real AI) must produce. */
export interface ClientAnalysisResult {
  chancePurchase: number;
  riskLoss: number;
  priority: "baixa" | "media" | "alta" | "critica";
  urgency: "baixa" | "media" | "alta";
  bestContactTime: string;
  strategy: string;
  nextAction: string;
  intelligentProfile: string;
  suggestedMessage: string;
  strategicReason: string;
  mainObjection: string;
  /** Bullet list explaining exactly what was considered ("Como cheguei nessa conclusão"). */
  analysisContext: string[];
}
