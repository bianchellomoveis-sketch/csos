import type { Interaction } from "@workspace/db";
import type { AIProvider } from "../AIProvider";
import type { ClientAnalysisInput, ClientAnalysisResult } from "../types";

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function daysSince(date: Date): number {
  const ms = Date.now() - date.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function objectionMessage(objection: string, firstName: string, product: string, recentSummaries: string[]): string {
  const normalized = objection.toLowerCase();
  const alreadySaid = (msg: string) => recentSummaries.some((s) => s.toLowerCase().includes(msg.toLowerCase().slice(0, 20)));

  const variants: string[] = [];
  if (normalized.includes("preço") || normalized.includes("preco") || normalized.includes("parcela") || normalized.includes("avaliação") || normalized.includes("avaliacao")) {
    variants.push(
      `Oi ${firstName}, tudo bem? Consegui uma condição diferenciada pra fechar o ${product} com uma parcela que cabe melhor no seu bolso. Posso te mandar os detalhes?`,
      `${firstName}, voltei aqui porque surgiu uma condição nova pro ${product} que pode resolver justamente aquela questão da parcela. Quer que eu te explique?`,
    );
  } else if (normalized.includes("distância") || normalized.includes("distancia")) {
    variants.push(
      `Oi ${firstName}! Sei que a distância pesa, então posso resolver tudo remoto e trazer o ${product} até você pra um test-drive rápido. Combinamos um horário?`,
      `${firstName}, pra facilitar de verdade eu posso ir até você com o ${product}, sem precisar se deslocar. Faz sentido pra essa semana?`,
    );
  } else if (normalized.includes("concorrência") || normalized.includes("concorrencia") || normalized.includes("outra loja")) {
    variants.push(
      `Oi ${firstName}, entendo que você está comparando opções. O ${product} que separei pra você tem diferenciais que fazem valer a pena -- posso te mostrar rapidinho?`,
      `${firstName}, imagino que esteja pesquisando em outros lugares também. Separei um comparativo rápido do ${product} pra você decidir com mais segurança, posso enviar?`,
    );
  } else {
    variants.push(
      `Oi ${firstName}, tudo bem? Passando pra saber se ficou alguma dúvida sobre o ${product}. Posso te ajudar a dar o próximo passo?`,
      `${firstName}, faz um tempinho que não conversamos sobre o ${product} -- ainda está na sua lista de planos? Posso te atualizar com novidades.`,
    );
  }

  const fresh = variants.find((v) => !alreadySaid(v)) ?? variants[variants.length - 1];
  return fresh;
}

/**
 * Rule-based local provider. Analyzes the FULL interaction history (not just
 * the latest) to compute purchase chance, loss risk, priority, urgency, best
 * contact time, strategy, an intelligent profile narrative, a fresh WhatsApp
 * message and the reasoning bullets behind the conclusion.
 */
export class LocalAIProvider implements AIProvider {
  async generateClientAnalysis({ client, interactions }: ClientAnalysisInput): Promise<ClientAnalysisResult> {
    const firstName = client.name.trim().split(/\s+/)[0] || client.name;
    const days = daysSince(new Date(client.lastInteractionAt));
    const stage = client.stage.toLowerCase();

    // interactions are expected sorted desc (most recent first)
    const ordered = [...interactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const latest = ordered[0];

    const objectionCounts = new Map<string, number>();
    for (const i of ordered) {
      const obj = (i.objection || "").trim();
      if (obj) objectionCounts.set(obj, (objectionCounts.get(obj) ?? 0) + 1);
    }
    const recurringObjection = [...objectionCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const objection = (recurringObjection?.[0] || latest?.objection || client.mainObjection || "").trim();

    const sentiments = ordered.map((i) => i.sentiment);
    const positiveCount = sentiments.filter((s) => s === "positivo").length;
    const negativeCount = sentiments.filter((s) => s === "negativo").length;
    const overallSentiment = latest?.sentiment ?? "neutro";
    const sentimentEvolvingPositive = sentiments.length >= 2 && sentiments[0] === "positivo" && sentiments[sentiments.length - 1] !== "positivo";

    // frequency: average days between interactions
    let avgGapDays: number | null = null;
    if (ordered.length >= 2) {
      const gaps: number[] = [];
      for (let idx = 0; idx < ordered.length - 1; idx++) {
        const a = new Date(ordered[idx].createdAt).getTime();
        const b = new Date(ordered[idx + 1].createdAt).getTime();
        gaps.push(Math.abs(a - b) / (1000 * 60 * 60 * 24));
      }
      avgGapDays = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
    }
    const respondsQuickly = avgGapDays !== null && avgGapDays <= 2;

    const hasTestDrive = stage.includes("test drive") || ordered.some((i) => i.type === "test_drive" || i.testDriveDone);
    const hasProposal = stage.includes("proposta") || ordered.some((i) => i.type === "proposta" || i.proposalSent);
    const hasAvaliacao = stage.includes("avaliação") || stage.includes("avaliacao") || ordered.some((i) => i.type === "avaliacao" || i.evaluationDone);
    const isSumido = stage.includes("sumido");

    let chance = 50;
    let risk = 30;
    const reasons: string[] = [];

    reasons.push(`Cliente ${client.temperature}`);
    if (client.temperature === "quente") {
      chance += 20;
    } else if (client.temperature === "frio") {
      chance -= 15;
    }

    reasons.push(days === 0 ? "Contato feito hoje" : `${days} dia(s) sem contato`);
    if (hasTestDrive) reasons.push("Test Drive realizado");
    if (hasProposal) reasons.push("Proposta enviada");
    if (hasAvaliacao) reasons.push("Avaliação do usado entregue");
    if (objection) reasons.push(`Objeção principal: ${objection}`);
    reasons.push(`Sentimento ${overallSentiment}`);
    if (respondsQuickly) reasons.push("Costuma responder rapidamente");
    if (avgGapDays !== null && !respondsQuickly) reasons.push("Costuma demorar para responder");
    if (ordered.length > 1) reasons.push(`${ordered.length} interações registradas no histórico`);
    if (sentimentEvolvingPositive) reasons.push("Sentimento piorou desde o início do contato");

    if (hasTestDrive && days > 2) {
      risk += 25;
    }
    if (hasProposal && days > 3) {
      risk += 25;
    }
    if (hasAvaliacao && isSumido) {
      risk += 35;
    }
    if (isSumido) {
      risk += 15;
      chance -= 10;
    }

    if (overallSentiment === "positivo") {
      chance += 15;
    } else if (overallSentiment === "negativo") {
      risk += 20;
      chance -= 10;
    }
    if (positiveCount > negativeCount && positiveCount >= 2) {
      chance += 5;
    }

    if (days >= 7) {
      risk += 20;
      chance -= 10;
    } else if (days >= 3) {
      risk += 10;
    }

    if ((recurringObjection?.[1] ?? 0) >= 2) {
      risk += 10;
      reasons.push(`Objeção "${objection}" já apareceu ${recurringObjection?.[1]} vezes`);
    }

    chance = clamp(Math.round(chance));
    risk = clamp(Math.round(risk));

    let priority: ClientAnalysisResult["priority"] = "baixa";
    if (risk >= 70 || (hasAvaliacao && isSumido)) {
      priority = "critica";
    } else if (risk >= 45 || (hasTestDrive && days > 2) || (hasProposal && days > 3)) {
      priority = "alta";
    } else if (risk >= 25 || days >= 3) {
      priority = "media";
    }

    let urgency: ClientAnalysisResult["urgency"] = "baixa";
    if (priority === "critica" || days >= 7) {
      urgency = "alta";
    } else if (priority === "alta" || days >= 3) {
      urgency = "media";
    }

    const bestContactTime = respondsQuickly
      ? "No mesmo horário das últimas respostas do cliente, aproveitando o padrão de resposta rápida"
      : days >= 5
        ? "O quanto antes -- cliente já está distante do contato, priorizar hoje"
        : "Período comercial (10h-18h), horário em que o cliente costuma interagir";

    const strategy = isSumido
      ? "Reativação direta: ligação + mensagem objetiva citando o último assunto tratado"
      : hasProposal
        ? "Follow-up consultivo da proposta, reforçando benefícios e criando senso de oportunidade"
        : hasTestDrive
          ? "Fechamento pós test-drive: entender objeções remanescentes e apresentar condição final"
          : "Aquecimento gradual: manter cadência de contato e aprofundar entendimento das necessidades";

    const nextAction = isSumido
      ? "Ligar agora para reativar o contato antes de perder o cliente"
      : hasProposal
        ? "Fazer follow-up da proposta enviada e reforçar benefícios"
        : hasTestDrive
          ? "Ligar para saber a decisão após o test drive"
          : days === 0
            ? "Manter o ritmo: enviar próxima informação combinada"
            : "Enviar mensagem de reengajamento pelo WhatsApp";

    const recentSummaries = ordered.slice(0, 5).map((i) => i.messageSent || i.summary || "");
    const suggestedMessage = objectionMessage(objection, firstName, client.product || "veículo", recentSummaries);

    const strategicReason = reasons.length > 0 ? reasons.join("; ") : "Cliente em acompanhamento padrão, sem sinais fortes de risco ou oportunidade.";

    const intelligentProfile = buildIntelligentProfile({
      firstName,
      hasTestDrive,
      hasProposal,
      hasAvaliacao,
      objection,
      respondsQuickly,
      days,
      ordered,
      overallSentiment,
    });

    return {
      chancePurchase: chance,
      riskLoss: risk,
      priority,
      urgency,
      bestContactTime,
      strategy,
      nextAction,
      intelligentProfile,
      suggestedMessage,
      strategicReason,
      mainObjection: objection,
      analysisContext: reasons,
    };
  }
}

function buildIntelligentProfile(args: {
  firstName: string;
  hasTestDrive: boolean;
  hasProposal: boolean;
  hasAvaliacao: boolean;
  objection: string;
  respondsQuickly: boolean;
  days: number;
  ordered: Interaction[];
  overallSentiment: string;
}): string {
  const { firstName, hasTestDrive, hasProposal, hasAvaliacao, objection, respondsQuickly, days, ordered, overallSentiment } = args;
  const sentences: string[] = [];

  if (ordered.length === 0) {
    return `${firstName} ainda não possui interações registradas. Assim que o primeiro contato for feito, o perfil será atualizado automaticamente.`;
  }

  sentences.push(
    overallSentiment === "positivo"
      ? `${firstName} demonstra interesse consistente no processo.`
      : overallSentiment === "negativo"
        ? `${firstName} tem demonstrado resistência nas últimas interações.`
        : `${firstName} está em acompanhamento neutro até o momento.`,
  );

  if (hasTestDrive) sentences.push("Já realizou test drive.");
  if (hasAvaliacao) sentences.push("Recebeu avaliação do veículo usado.");
  if (hasProposal) sentences.push("Já recebeu proposta comercial.");
  if (objection) sentences.push(`Principal objeção continua sendo ${objection.toLowerCase()}.`);
  sentences.push(respondsQuickly ? "Costuma responder rapidamente aos contatos." : "Costuma demorar para responder aos contatos.");
  if (days >= 5) sentences.push(`Está há ${days} dias sem interação -- atenção redobrada.`);

  return sentences.join(" ");
}
