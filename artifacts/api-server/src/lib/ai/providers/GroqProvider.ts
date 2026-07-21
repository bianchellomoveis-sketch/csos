import type { AIProvider } from "../AIProvider";
import type { ClientAnalysisInput, ClientAnalysisResult } from "../types";
import { loadAIConfig } from "../config";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODEL = "llama-3.3-70b-versatile";
const REQUEST_TIMEOUT_MS = 30_000;

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
}

const validPriorities = ["baixa", "media", "alta", "critica"] as const;
const validUrgencies = ["baixa", "media", "alta"] as const;

function clampPercentage(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error("A IA retornou uma porcentagem inválida.");
  }

  return Math.round(Math.min(100, Math.max(0, parsed)));
}

function requireText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`A IA não retornou o campo obrigatório: ${field}.`);
  }

  return value.trim();
}

function parseAnalysis(
  content: string,
  input: ClientAnalysisInput,
): ClientAnalysisResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("O Groq retornou uma resposta que não é um JSON válido.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("O Groq retornou uma estrutura de análise inválida.");
  }

  const data = parsed as Record<string, unknown>;
  const proposalWasSent = input.interactions.some(
    (interaction) =>
      interaction.proposalSent === true || interaction.type === "proposta",
  );

  const urgency = data.urgency;

  if (
    typeof urgency !== "string" ||
    !validUrgencies.includes(urgency as (typeof validUrgencies)[number])
  ) {
    throw new Error("A IA retornou uma urgência inválida.");
  }

  const chancePurchase = clampPercentage(data.chancePurchase);
  const riskLoss = clampPercentage(data.riskLoss);

  const receivedPriority = data.priority;

  if (
    typeof receivedPriority !== "string" ||
    !validPriorities.includes(
      receivedPriority as (typeof validPriorities)[number],
    )
  ) {
    throw new Error("A IA retornou uma prioridade inválida.");
  }

  let priority = receivedPriority as ClientAnalysisResult["priority"];

  /*
   * Regra de segurança comercial:
   * prioridade representa necessidade de atuação, não apenas chance de compra.
   * Um cliente com alto risco de perda não pode ser classificado como baixa
   * prioridade somente porque sua chance atual de compra é pequena.
   */
  if (riskLoss >= 75) {
    priority = "critica";
  } else if (riskLoss >= 50 && priority !== "critica") {
    priority = "alta";
  }

  const analysisContext = Array.isArray(data.analysisContext)
    ? data.analysisContext
        .filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0,
        )
        .map((item) => item.trim())
        .slice(0, 8)
    : [];

  return {
    chancePurchase,
    riskLoss,
    priority,
    urgency: urgency as ClientAnalysisResult["urgency"],
    bestContactTime: requireText(data.bestContactTime, "bestContactTime"),
    strategy: requireText(data.strategy, "strategy"),
    nextAction: requireText(data.nextAction, "nextAction"),
    intelligentProfile: requireText(
      data.intelligentProfile,
      "intelligentProfile",
    ),
    suggestedMessage: (() => {
      const message = requireText(data.suggestedMessage, "suggestedMessage");

      if (!proposalWasSent && /\bproposta\b/i.test(message)) {
        throw new Error(
          "A IA mencionou proposta sem haver proposta registrada.",
        );
      }

      return message;
    })(),
    strategicReason: requireText(data.strategicReason, "strategicReason"),
    mainObjection: requireText(data.mainObjection, "mainObjection"),
    analysisContext,
  };
}

function buildPrompt(input: ClientAnalysisInput): string {
  const interactions = [...input.interactions]
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .map((interaction) => ({
      date: interaction.createdAt,
      type: interaction.type,
      summary: interaction.summary,
      objection: interaction.objection,
      sentiment: interaction.sentiment,
      notes: interaction.notes,
      proposalSent: interaction.proposalSent,
      evaluationDone: interaction.evaluationDone,
      testDriveDone: interaction.testDriveDone,
      messageSent: interaction.messageSent,
      clientResponse: interaction.clientResponse,
      importantChanges: interaction.importantChanges,
    }));

  const cognitiveInput = {
    client: {
      name: input.client.name,
      product: input.client.product,
      origin: input.client.origin,
      stage: input.client.stage,
      temperature: input.client.temperature,
      status: input.client.status,
      notes: input.client.notes,
      createdAt: input.client.createdAt,
      updatedAt: input.client.updatedAt,
      lastInteractionAt: input.client.lastInteractionAt,
    },
    interactions,
  };

  return `
Analise o cliente abaixo como um especialista em vendas consultivas
automotivas e gestão de relacionamento comercial.

OBJETIVO:
Determinar o estado comercial atual, a próxima melhor ação e uma
mensagem que o vendedor possa realmente enviar.

REGRAS OBRIGATÓRIAS:
- Use exclusivamente os fatos fornecidos.
- Não invente descontos, campanhas, aprovações, disponibilidade,
  avaliações, prazos, condições especiais ou urgências.
- Quando os dados forem insuficientes, deixe isso claro na estratégia.
- Considere todo o histórico em ordem cronológica.
- Diferencie interesse real de cordialidade.
- Considere silêncio, objeções repetidas, avanço de etapa, test drive,
  proposta, avaliação e respostas do cliente.
  - O campo "product" representa o veículo ou produto que o cliente deseja comprar.
  - Não trate "product" como o veículo usado entregue na troca, a menos que isso esteja explicitamente informado no histórico.
  - Quando houver avaliação de usado, diferencie claramente:
    veículo desejado pelo cliente e veículo usado avaliado.
  - Prioridade representa necessidade de atuação comercial, não apenas chance de compra.
  - Cliente com risco de perda igual ou superior a 50 não pode receber prioridade baixa.
  - Em "bestContactTime", seja objetivo e operacional, por exemplo:
    "Hoje entre 17h e 19h" ou "Amanhã pela manhã".
    - Só mencione proposta enviada, condição apresentada ou negociação formal
      quando "proposalSent" estiver verdadeiro ou isso estiver explicitamente
      registrado no resumo, mensagem enviada ou resposta do cliente.
    - Quando "proposalSent" estiver falso, não use expressões como
      "avaliar a proposta", "proposta enviada" ou "condição apresentada".
    - Não transforme uma avaliação de veículo usado em proposta comercial.
- A mensagem deve ser natural, curta, pessoal e sem pressão artificial.
- Não use markdown.
- Retorne somente um objeto JSON válido.
- Todos os textos devem estar em português do Brasil.

FORMATO EXATO:
{
  "chancePurchase": 0,
  "riskLoss": 0,
  "priority": "baixa | media | alta | critica",
  "urgency": "baixa | media | alta",
  "bestContactTime": "texto",
  "strategy": "texto",
  "nextAction": "texto",
  "intelligentProfile": "texto",
  "suggestedMessage": "texto",
  "strategicReason": "texto",
  "mainObjection": "texto",
  "analysisContext": ["evidência 1", "evidência 2"]
}

DADOS:
${JSON.stringify(cognitiveInput)}
`.trim();
}

/**
 * Real Groq integration used by SalesBrainCore.
 *
 * Any request, API, parsing or validation failure is propagated so the
 * orchestrator can safely activate LocalAIProvider as fallback.
 */
export class GroqProvider implements AIProvider {
  async generateClientAnalysis(
    input: ClientAnalysisInput,
  ): Promise<ClientAnalysisResult> {
    const { groqApiKey } = loadAIConfig();

    if (!groqApiKey) {
      throw new Error("GROQ_API_KEY não configurada.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          temperature: 0.2,
          max_completion_tokens: 1800,
          response_format: {
            type: "json_object",
          },
          messages: [
            {
              role: "system",
              content:
                "Você é o núcleo cognitivo de um sistema comercial. Produza análises rigorosas, factuais e estruturadas.",
            },
            {
              role: "user",
              content: buildPrompt(input),
            },
          ],
        }),
        signal: controller.signal,
      });

      const payload = (await response.json()) as GroqResponse;

      if (!response.ok) {
        const apiMessage = payload.error?.message || `HTTP ${response.status}`;

        throw new Error(`Falha na API Groq: ${apiMessage}`);
      }

      const content = payload.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("O Groq retornou uma resposta vazia.");
      }

      return parseAnalysis(content, input);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          "A análise do Groq excedeu o tempo limite de 30 segundos.",
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
