import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatTimeAgo(dateString: string | undefined): string {
  if (!dateString) return "Sem contato";
  
  const date = new Date(dateString);
  const distance = formatDistanceToNow(date, { locale: ptBR, addSuffix: false });
  
  if (distance.includes("menos de um minuto")) return "Agora";
  
  // Custom replacements to sound more natural
  return distance
    .replace("cerca de ", "")
    .replace("mais de ", "")
    .replace("quase ", "") + " sem contato";
}

export function cleanPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10 || cleaned.length === 11) {
    return `55${cleaned}`;
  }
  return cleaned;
}

export function getTemperatureColor(temp: string): string {
  switch (temp) {
    case "quente": return "text-orange-500 bg-orange-500/10 border-orange-500/20";
    case "morno": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    case "frio": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    default: return "text-gray-400 bg-gray-400/10 border-gray-400/20";
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "critica": return "text-red-500 bg-red-500/10 border-red-500/20";
    case "alta": return "text-orange-500 bg-orange-500/10 border-orange-500/20";
    case "media": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    case "baixa": return "text-green-400 bg-green-400/10 border-green-400/20";
    default: return "text-gray-400 bg-gray-400/10 border-gray-400/20";
  }
}

export function getTimeAgoColor(dateString: string | undefined): string {
  if (!dateString) return "text-red-500 bg-red-500/10 border-red-500/20"; // Urgente
  
  const days = (new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24);
  
  if (days < 1) return "text-green-400 bg-green-400/10 border-green-400/20"; // Recente
  if (days < 3) return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"; // Atenção
  return "text-red-500 bg-red-500/10 border-red-500/20"; // Urgente
}