import type { Client, Interaction } from "@workspace/db";

export interface AiResult {
  chancePurchase: number;
  riskLoss: number;
  priority: "baixa" | "media" | "alta" | "critica";
  nextAction: string;
  suggestedMessage: string;
  strategicReason: string;
  mainObjection: string;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function daysSince(date: Date): number {
  const ms = Date.now() - date.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function objectionMessage(objection: string, firstName: string, product: string): string {
  const normalized = objection.toLowerCase();
  if (normalized.includes("preço") || normalized.includes("preco") || normalized.includes("parcela") || normalized.includes("avaliação") || normalized.includes("avaliacao")) {
    return `Oi ${firstName}, tudo bem? Consegui uma condição diferenciada pra fechar o ${product} com uma parcela que cabe melhor no seu bolso. Posso te mandar os detalhes sem compromisso?`;
  }
  if (normalized.includes("distância") || normalized.includes("distancia")) {
    return `Oi ${firstName}! Sei que a distância pesa, então posso resolver tudo remoto e trazer o ${product} até você pra um test-drive rápido. Combinamos um horário?`;
  }
  if (normalized.includes("concorrência") || normalized.includes("concorrencia") || normalized.includes("outra loja")) {
    return `Oi ${firstName}, entendo que você está comparando opções. O ${product} que separei pra você tem diferenciais que fazem valer a pena -- posso te mostrar rapidinho?`;
  }
  return `Oi ${firstName}, tudo bem? Passando pra saber se ficou alguma dúvida sobre o ${product}. Posso te ajudar a dar o próximo passo?`;
}

/**
 * Rule-based local AI: analyzes stage, days without contact, temperature,
 * interaction history, main objection and sentiment to score a client.
 */
export function computeAiFields(
  client: Pick<Client, "name" | "product" | "stage" | "temperature" | "lastInteractionAt" | "notes" | "mainObjection">,
  interactions: Pick<Interaction, "type" | "objection" | "sentiment" | "createdAt">[],
): AiResult {
  const firstName = client.name.trim().split(/\s+/)[0] || client.name;
  const days = daysSince(new Date(client.lastInteractionAt));
  const stage = client.stage.toLowerCase();
  const latest = interactions[0];
  const notesSignal = analyzeImportedText(client.notes || "");
  const objection = (latest?.objection || client.mainObjection || notesSignal.objection || "").trim();
  const sentiment = latest?.sentiment ?? notesSignal.sentiment;

  let chance = 50;
  let risk = 30;
  const reasons: string[] = [];

  // Temperature
  if (client.temperature === "quente") {
    chance += 20;
    reasons.push("cliente está quente, aumentando a chance de fechamento");
  } else if (client.temperature === "frio") {
    chance -= 15;
    reasons.push("cliente frio reduz a chance de conversão no curto prazo");
  }

  // Stage-based rules
  const hasTestDrive = stage.includes("test drive") || interactions.some((i) => i.type === "test_drive");
  const hasProposal = stage.includes("proposta") || interactions.some((i) => i.type === "proposta");
  const hasAvaliacao = stage.includes("avaliação") || stage.includes("avaliacao") || interactions.some((i) => i.type === "avaliacao");
  const isSumido = stage.includes("sumido");

  if (hasTestDrive && days > 2) {
    risk += 25;
    reasons.push("test drive feito há mais de 2 dias sem retorno exige contato imediato");
  }
  if (hasProposal && days > 3) {
    risk += 25;
    reasons.push("proposta enviada sem contato há mais de 3 dias eleva o risco de perda");
  }
  if (hasAvaliacao && isSumido) {
    risk += 35;
    reasons.push("avaliação entregue e cliente sumido -- risco crítico de perda");
  }
  if (isSumido) {
    risk += 15;
    chance -= 10;
    reasons.push("cliente sumido reduz a chance e aumenta o risco");
  }

  // Sentiment
  if (sentiment === "positivo") {
    chance += 15;
    reasons.push("sentimento positivo na última interação aumenta a chance");
  } else if (sentiment === "negativo") {
    risk += 20;
    chance -= 10;
    reasons.push("sentimento negativo na última interação eleva o risco");
  }

  // Days without contact decay
  if (days >= 7) {
    risk += 20;
    chance -= 10;
    reasons.push("mais de 7 dias sem contato");
  } else if (days >= 3) {
    risk += 10;
    reasons.push("já se passaram alguns dias sem contato");
  }

  chance = clamp(Math.round(chance));
  risk = clamp(Math.round(risk));

  // Priority
  let priority: AiResult["priority"] = "baixa";
  if (risk >= 70 || (hasAvaliacao && isSumido)) {
    priority = "critica";
  } else if (risk >= 45 || (hasTestDrive && days > 2) || (hasProposal && days > 3)) {
    priority = "alta";
  } else if (risk >= 25 || days >= 3) {
    priority = "media";
  }

  const nextAction = isSumido
    ? "Ligar agora para reativar o contato antes de perder o cliente"
    : hasProposal
      ? "Fazer follow-up da proposta enviada e reforçar benefícios"
      : hasTestDrive
        ? "Ligar para saber a decisão após o test drive"
        : days === 0
          ? "Manter o ritmo: enviar próxima informação combinada"
          : "Enviar mensagem de reengajamento pelo WhatsApp";

  const suggestedMessage = objectionMessage(objection, firstName, client.product || "veículo");

  const strategicReason = reasons.length > 0 ? reasons.join("; ") : "Cliente em acompanhamento padrão, sem sinais fortes de risco ou oportunidade.";

  return {
    chancePurchase: chance,
    riskLoss: risk,
    priority,
    nextAction,
    suggestedMessage,
    strategicReason,
    mainObjection: objection,
  };
}

export function computePriorityScore(chancePurchase: number, riskLoss: number, lastInteractionAt: Date): number {
  const days = daysSince(lastInteractionAt);
  return chancePurchase * riskLoss * Math.max(1, days);
}

/**
 * Very lightweight text analysis for pasted WhatsApp history.
 * Looks for keyword signals to infer temperature, objection and sentiment,
 * then reuses computeAiFields for the rest.
 */
export function analyzeImportedText(text: string): {
  summary: string;
  objection: string;
  sentiment: "positivo" | "neutro" | "negativo";
  temperature: "frio" | "morno" | "quente";
} {
  const lower = text.toLowerCase();

  let objection = "";
  if (lower.includes("preço") || lower.includes("preco") || lower.includes("caro") || lower.includes("parcela")) {
    objection = "Preço/parcela";
  } else if (lower.includes("longe") || lower.includes("distância") || lower.includes("distancia")) {
    objection = "Distância";
  } else if (lower.includes("outra loja") || lower.includes("concorrente") || lower.includes("concorrência") || lower.includes("concorrencia")) {
    objection = "Concorrência";
  } else if (lower.includes("avaliação") || lower.includes("avaliacao") || lower.includes("meu carro")) {
    objection = "Avaliação do usado";
  }

  let sentiment: "positivo" | "neutro" | "negativo" = "neutro";
  const positiveWords = ["ótimo", "otimo", "adorei", "gostei", "interessado", "quero", "top", "show", "fechado"];
  const negativeWords = ["não quero", "nao quero", "desisti", "caro demais", "sem interesse", "não gostei", "nao gostei"];
  if (negativeWords.some((w) => lower.includes(w))) {
    sentiment = "negativo";
  } else if (positiveWords.some((w) => lower.includes(w))) {
    sentiment = "positivo";
  }

  let temperature: "frio" | "morno" | "quente" = "morno";
  if (sentiment === "positivo") temperature = "quente";
  if (sentiment === "negativo") temperature = "frio";

  const summary = text.trim().length > 220 ? `${text.trim().slice(0, 220)}...` : text.trim();

  return { summary, objection, sentiment, temperature };
}
