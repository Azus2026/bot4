import { BusinessLead, ScoreBreakdownItem, WebAuditData } from "@/types/lead";

export function calculatePreliminaryScore(lead: {
  websiteType: BusinessLead["websiteType"];
  userRatingCount: number;
  googleRating: number;
}): { score: number; breakdown: ScoreBreakdownItem[] } {
  const breakdown: ScoreBreakdownItem[] = [];
  let score = 0;

  // 1. Presencia Web
  if (lead.websiteType === "NONE") {
    score += 45;
    breakdown.push({
      label: "Sin página web",
      points: 45,
      type: "positive",
      explanation: "No tiene ningún sitio web registrado. Requiere presencia digital inmediata.",
    });
  } else if (lead.websiteType === "SOCIAL_MEDIA") {
    score += 45;
    breakdown.push({
      label: "Solo enlace a red social o directorio",
      points: 45,
      type: "positive",
      explanation: "Depende exclusivamente de redes de terceros. Alta oportunidad para vender web propia.",
    });
  } else {
    score += 10;
    breakdown.push({
      label: "Tiene sitio web propio",
      points: 10,
      type: "neutral",
      explanation: "Tiene web activa. Candidato para optimización, rediseño o automatización con IA.",
    });
  }

  // 2. Volumen de Reseñas / Tracción
  if (lead.userRatingCount > 50) {
    score += 20;
    breakdown.push({
      label: "Alto flujo de clientes (>50 reseñas)",
      points: 20,
      type: "positive",
      explanation: "Negocio consolidado con clientela constante y capacidad de inversión comprobada.",
    });
  } else if (lead.userRatingCount >= 15) {
    score += 10;
    breakdown.push({
      label: "Tracción moderada (15-50 reseñas)",
      points: 10,
      type: "positive",
      explanation: "Negocio activo con facturación demostrable.",
    });
  } else {
    breakdown.push({
      label: "Bajo volumen de reseñas (<15 reseñas)",
      points: 0,
      type: "neutral",
      explanation: "Actividad digital incipiente o negocio muy nuevo.",
    });
  }

  // 3. Valoración / Margen de Mejora
  if (lead.googleRating >= 3.8 && lead.googleRating <= 4.7) {
    score += 15;
    breakdown.push({
      label: "Calificación con margen de mejora (3.8 - 4.7★)",
      points: 15,
      type: "positive",
      explanation: "Buena reputación comercial con espacio claro para mejorar atención y reservas.",
    });
  } else if (lead.googleRating > 4.7 || (lead.googleRating > 0 && lead.googleRating < 3.8)) {
    score += 5;
    breakdown.push({
      label: "Calificación extrema (>4.7★ o <3.8★)",
      points: 5,
      type: "neutral",
      explanation: "O muy fidelizado con posibles agencias, o con posibles problemas de servicio.",
    });
  }

  return {
    score: Math.min(80, Math.max(0, score)),
    breakdown,
  };
}

export function calculateDefinitiveScore(
  preliminaryScore: number,
  preliminaryBreakdown: ScoreBreakdownItem[],
  webAudit?: WebAuditData
): { score: number; breakdown: ScoreBreakdownItem[] } {
  if (!webAudit) {
    return {
      score: preliminaryScore,
      breakdown: preliminaryBreakdown,
    };
  }

  const breakdown: ScoreBreakdownItem[] = [...preliminaryBreakdown];
  let delta = 0;

  const pageSpeed = webAudit.pageSpeedScores;
  const analysis = webAudit.analysis;

  // 1. Rendimiento Mobile PageSpeed
  if (pageSpeed && pageSpeed.performance < 50) {
    delta += 15;
    breakdown.push({
      label: "Rendimiento móvil crítico (<50 pts)",
      points: 15,
      type: "positive",
      explanation: "La web es muy lenta en teléfonos móviles; pierden prospectos por tiempos de carga.",
    });
  }

  // 2. SEO o Accesibilidad deficientes
  if (pageSpeed && (pageSpeed.seo < 60 || pageSpeed.accessibility < 60)) {
    delta += 10;
    breakdown.push({
      label: "Deficiencias de SEO o Accesibilidad (<60 pts)",
      points: 10,
      type: "positive",
      explanation: "Visibilidad limitada en Google o problemas estructurales en la navegación.",
    });
  }

  // 3. Falta de botón de WhatsApp directo
  if (analysis.checklist && !analysis.checklist.hasWhatsApp) {
    delta += 15;
    breakdown.push({
      label: "Sin botón directo de WhatsApp",
      points: 15,
      type: "positive",
      explanation: "Fuga de clientes potenciales que quieren atención rápida por mensajería.",
    });
  }

  // 4. Falta de Citas Online
  if (analysis.checklist && !analysis.checklist.hasBooking) {
    delta += 10;
    breakdown.push({
      label: "Sin sistema de citas / reservas online",
      points: 10,
      type: "positive",
      explanation: "Pierden clientes fuera del horario comercial al no tener reserva automatizada.",
    });
  }

  // 5. Web desactualizada (>2 años de antigüedad)
  if (analysis.checklist && analysis.checklist.isOutdated) {
    delta += 10;
    breakdown.push({
      label: "Web con señales de abandono / desactualizada",
      points: 10,
      type: "positive",
      explanation: "Copyright antiguo o tecnologías en desuso; alta predisposición para renovar.",
    });
  }

  // 6. Penalización si la web ya es excelente
  if (pageSpeed && pageSpeed.performance >= 90 && pageSpeed.seo >= 90) {
    delta -= 25;
    breakdown.push({
      label: "Web de excelente rendimiento y optimización",
      points: -25,
      type: "negative",
      explanation: "El cliente ya cuenta con soporte técnico de alta calidad; menor probabilidad de cierre.",
    });
  }

  const finalScore = Math.min(100, Math.max(0, preliminaryScore + delta));

  return {
    score: finalScore,
    breakdown,
  };
}
