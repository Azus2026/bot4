import { BusinessLead, LeadStatus } from "@/types/lead";

const CONTACT_STATES: LeadStatus[] = ["CONTACTADO", "RESPONDIO", "REUNION", "CLIENTE"];

/** Reglas de flujo: devuelve null si el cambio es válido, o el motivo del bloqueo. */
export function checkStatusTransition(lead: BusinessLead, next: LeadStatus): string | null {
  if (lead.doNotContact && (next === "PROPUESTA_LISTA" || CONTACT_STATES.includes(next))) {
    return "Este negocio está marcado como 'No contactar'.";
  }
  if (next === "PROPUESTA_LISTA" && !lead.proposal) {
    return "Primero genera la propuesta en la pestaña Propuestas.";
  }
  if (lead.status === "PROPUESTA_LISTA" && CONTACT_STATES.includes(next) && !lead.proposal?.approvedAt) {
    return "La propuesta debe aprobarse manualmente antes de contactar.";
  }
  return null;
}
