import { BusinessLead, CitySnapshot, ProposalData, ProposalPricing, SellerProfile } from "@/types/lead";
import { isHotelLead } from "./hotel";

export const DEFAULT_PROPOSAL_PRICING: ProposalPricing = {
  currency: "S/",
  setupMin: 800,
  setupMax: 1500,
  plans: [
    { name: "Básico", monthlyPrice: 89, features: ["Gestión de habitaciones y reservas", "Check-in / check-out", "Caja diaria y reportes", "Soporte por WhatsApp"] },
    { name: "Pro", monthlyPrice: 169, features: ["Todo lo del Básico", "Web propia con motor de reservas directas", "Calendario sincronizado con Booking/Airbnb (iCal)", "Reportes de ocupación e ingresos"] },
    { name: "Premium", monthlyPrice: 299, features: ["Todo lo del Pro", "Asistente de WhatsApp para consultas y reservas", "Diseño a medida de la marca", "Capacitación del personal y soporte prioritario"] },
  ],
};

export function formatMoney(pricing: ProposalPricing, n: number) {
  return `${pricing.currency} ${n.toLocaleString("es-PE")}`;
}

export function pickPlan(lead: BusinessLead, pricing: ProposalPricing): string {
  const plans = pricing.plans;
  if (plans.length === 0) return "";
  const idx = lead.userRatingCount > 120 ? 2 : lead.websiteType !== "CUSTOM_WEBSITE" ? 1 : 0;
  return plans[Math.min(idx, plans.length - 1)].name;
}

export interface ProposalInput {
  lead: BusinessLead;
  snapshot?: CitySnapshot;
  seller: Pick<SellerProfile, "fullName" | "brandName">;
  pricing?: ProposalPricing;
  caseStudy?: string;
}

export const DEFAULT_CASE_STUDY =
  "Hotel Sumac (Puquio, Ayacucho) usa el sistema Sumac Gestión para controlar habitaciones, reservas y caja desde el celular, reemplazando el cuaderno de registro.";

export function buildWhatsappDraft(input: ProposalInput, mainIssue: string): string {
  const { lead, seller } = input;
  return [
    `Hola, buen día. Soy ${seller.fullName}${seller.brandName ? ` de ${seller.brandName}` : ""}.`,
    `Revisé ${lead.name} en Google Maps (${lead.googleRating}★, ${lead.userRatingCount} reseñas) y noté que ${mainIssue}.`,
    `Preparé una propuesta corta y personalizada para ${lead.name}, basada en un sistema que ya funciona en un hotel de Puquio.`,
    `¿Le puedo enviar el PDF por aquí? Si prefiere que no le escriba, me avisa y no vuelvo a contactarle.`,
  ].join("\n\n");
}

/** Plantilla determinista: se usa cuando no hay clave de Gemini o la IA falla. */
export function buildTemplateProposal(input: ProposalInput): ProposalData {
  const pricing = input.pricing || DEFAULT_PROPOSAL_PRICING;
  const { lead, snapshot } = input;
  const hotel = isHotelLead(lead);
  const noun = hotel ? "su hospedaje" : "su negocio";
  const diagnosis: string[] = [];

  if (lead.websiteType === "NONE") diagnosis.push("No tiene página web propia: depende de Google Maps, OTAs o llamadas para recibir reservas.");
  if (lead.websiteType === "SOCIAL_MEDIA") diagnosis.push(`Su enlace principal es una red social (${lead.socialNetworkDetected || "red social"}), sin reservas directas ni disponibilidad en línea.`);
  const ck = lead.webAudit?.analysis.checklist;
  if (ck && !ck.hasBooking) diagnosis.push("La web no permite reservar en línea; cada reserva requiere atención manual.");
  if (ck && !ck.hasWhatsApp) diagnosis.push("La web no tiene botón directo de WhatsApp, el canal preferido por los huéspedes en Perú.");
  const ps = lead.webAudit?.pageSpeedScores;
  if (ps && ps.performance < 50) diagnosis.push(`La web carga lento en celulares (rendimiento ${ps.performance}/100).`);
  for (const p of lead.webAudit?.analysis.painPoints?.slice(0, 2) || []) diagnosis.push(`${p.issue}: ${p.impact}`);
  if (lead.googleRating > 0 && lead.googleRating < 4.5) diagnosis.push(`Su valoración (${lead.googleRating}★) tiene margen de mejora: una operación ordenada se refleja en reseñas.`);
  if (diagnosis.length === 0) diagnosis.push("Buena presencia digital; la oportunidad está en ordenar la operación interna y medir la ocupación.");

  const marketContext: string[] = [];
  if (snapshot && snapshot.totalBusinesses > 0) {
    const label = snapshot.hotelCount > 0 ? "hospedajes" : "negocios";
    const n = snapshot.hotelCount || snapshot.totalBusinesses;
    marketContext.push(`Analizamos ${n} ${label} en ${snapshot.city} con datos públicos de Google.`);
    marketContext.push(`El ${snapshot.withoutWebsitePercent}% no tiene web propia y la valoración media es ${snapshot.averageRating}★ (${snapshot.averageReviews} reseñas en promedio).`);
    if (lead.userRatingCount > snapshot.averageReviews) marketContext.push(`${lead.name} tiene más reseñas que el promedio local: ya tiene la demanda, falta convertirla en reservas directas.`);
    else marketContext.push(`Digitalizarse ahora le permite destacar frente a la competencia de ${snapshot.city}.`);
  } else {
    marketContext.push("Aún no hay suficientes datos de la ciudad; se recomienda buscar más negocios del rubro en el Radar.");
  }

  const recommendedPlan = pickPlan(lead, pricing);
  const plan = pricing.plans.find((p) => p.name === recommendedPlan);
  const mainIssue = (diagnosis[0] || "hay oportunidades de mejora").replace(/\.$/, "").replace(/^./, (c) => c.toLowerCase());

  return {
    title: `Propuesta para ${lead.name}`,
    executiveSummary: `${lead.name} ya tiene la confianza de sus huéspedes (${lead.googleRating}★ en Google). Proponemos implementar un sistema de gestión diseñado a medida para ${noun}, que centraliza reservas, habitaciones y caja en el celular, y suma reservas directas sin comisiones de intermediarios.`,
    diagnosis: diagnosis.slice(0, 5),
    marketContext,
    solution: [
      "Panel de habitaciones y reservas en tiempo real, accesible desde el celular.",
      "Registro de huéspedes, check-in/check-out y caja diaria sin cuadernos ni Excel.",
      "Reportes de ocupación e ingresos por día, semana y mes.",
      "Implementación personalizada: carga de habitaciones, tarifas, diseño con su marca y capacitación.",
      `Caso real: ${input.caseStudy || DEFAULT_CASE_STUDY}`,
    ],
    recommendedPlan,
    pricing,
    roiEstimate: plan
      ? `Con el plan ${plan.name} (${formatMoney(pricing, plan.monthlyPrice)}/mes), basta con evitar una o dos noches perdidas o una comisión de OTA al mes para cubrir el costo.`
      : "El sistema se paga con pocas reservas directas adicionales al mes.",
    nextSteps: [
      "Demostración de 20 minutos (presencial o videollamada).",
      "Levantamiento de habitaciones, tarifas y flujo actual.",
      "Implementación y capacitación en 7 a 10 días.",
      "Primer mes con acompañamiento y garantía de satisfacción.",
    ],
    whatsappDraft: buildWhatsappDraft(input, mainIssue),
    generatedBy: "template",
    generatedAt: new Date().toISOString(),
  };
}

/** Valida/normaliza la respuesta JSON de Gemini, completando con la plantilla. */
export function mergeAiProposal(ai: any, fallback: ProposalData): ProposalData {
  const arr = (v: any, d: string[]) => (Array.isArray(v) && v.every((x) => typeof x === "string") && v.length ? v.slice(0, 6) : d);
  const str = (v: any, d: string) => (typeof v === "string" && v.trim() ? v.trim() : d);
  return {
    ...fallback,
    title: str(ai?.title, fallback.title),
    executiveSummary: str(ai?.executiveSummary, fallback.executiveSummary),
    diagnosis: arr(ai?.diagnosis, fallback.diagnosis),
    marketContext: arr(ai?.marketContext, fallback.marketContext),
    solution: arr(ai?.solution, fallback.solution),
    recommendedPlan: fallback.pricing.plans.some((p) => p.name === ai?.recommendedPlan) ? ai.recommendedPlan : fallback.recommendedPlan,
    roiEstimate: str(ai?.roiEstimate, fallback.roiEstimate),
    nextSteps: arr(ai?.nextSteps, fallback.nextSteps),
    whatsappDraft: str(ai?.whatsappDraft, fallback.whatsappDraft),
    generatedBy: "gemini",
  };
}
