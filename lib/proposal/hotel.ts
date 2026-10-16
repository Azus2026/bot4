import { BusinessLead, CitySnapshot, ScoreBreakdownItem } from "@/types/lead";

const HOTEL_RE = /(hotel|hostal|hostel|hospedaje|alojamiento|lodge|casa de hu[eé]spedes|guest ?house|inn\b|posada|apart ?hotel|bed and breakfast|b&b)/i;

export function isHotelLead(lead: Pick<BusinessLead, "category" | "name">): boolean {
  return HOTEL_RE.test(lead.category || "") || HOTEL_RE.test(lead.name || "");
}

export function normalizeText(s: string): string {
  return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/** Extrae la ciudad de una dirección de Google ("Jr. Lima 123, Ayacucho 05001, Perú" -> "Ayacucho"). */
export function extractCity(address: string): string {
  const parts = (address || "").split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return "Sin ciudad";
  const candidate = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  const cleaned = candidate.replace(/\d+/g, "").replace(/\s+/g, " ").trim();
  return cleaned || "Sin ciudad";
}

export function leadInCity(lead: BusinessLead, city: string): boolean {
  return normalizeText(extractCity(lead.formattedAddress)) === normalizeText(city);
}

export interface HotelScoreResult {
  score: number; // 0-100
  eligible: boolean;
  breakdown: ScoreBreakdownItem[];
}

/** Score específico para vender un sistema de gestión hotelera (Sumac). Prioriza calidad sobre volumen. */
export function calculateHotelScore(lead: BusinessLead, snapshot?: CitySnapshot): HotelScoreResult {
  const breakdown: ScoreBreakdownItem[] = [];
  const add = (label: string, points: number, explanation: string, type: ScoreBreakdownItem["type"] = "positive") => {
    breakdown.push({ label, points, type, explanation });
    return points;
  };

  if (lead.doNotContact) {
    return { score: 0, eligible: false, breakdown: [{ label: "No contactar", points: 0, type: "negative", explanation: "Marcado como no contactar." }] };
  }
  if (lead.businessStatus !== "OPERATIONAL") {
    return { score: 0, eligible: false, breakdown: [{ label: "Negocio no operativo", points: 0, type: "negative", explanation: "Cerrado temporal o permanentemente." }] };
  }

  let score = 0;
  if (isHotelLead(lead)) score += add("Rubro hospedaje", 20, "Encaja directamente con Sumac (gestión hotelera).");
  else score += add("Rubro fuera de hospedaje", 0, "Requiere adaptar el sistema; menor prioridad.", "neutral");

  if (lead.websiteType === "NONE") score += add("Sin web propia", 15, "Depende de terceros para captar reservas.");
  else if (lead.websiteType === "SOCIAL_MEDIA") score += add("Solo redes sociales", 12, "Reservas por mensaje directo, sin control centralizado.");

  const hasBooking = lead.webAudit?.analysis.checklist?.hasBooking;
  if (hasBooking === false || lead.websiteType !== "CUSTOM_WEBSITE") {
    score += add("Sin motor de reservas", 15, "Probable gestión manual (cuaderno/Excel/WhatsApp).");
  }

  const r = lead.userRatingCount || 0;
  if (r >= 15 && r <= 300) score += add("Tracción real (15-300 reseñas)", 15, "Negocio activo, independiente y con flujo de huéspedes.");
  else if (r > 300) score += add("Muy alto volumen (>300)", 5, "Posible cadena o ya usa un PMS.", "neutral");
  else score += add("Pocas reseñas (<15)", 0, "Negocio pequeño o nuevo.", "neutral");

  const g = lead.googleRating || 0;
  if (g >= 3.8 && g <= 4.7) score += add("Reputación mejorable (3.8-4.7★)", 10, "Una mejor operación se refleja rápido en reseñas.");
  else if (g > 4.7) score += add("Excelente reputación", 5, "Cliente vitrina ideal para caso de éxito.", "neutral");

  if (lead.phone || lead.internationalPhone) score += add("Teléfono público", 10, "Permite contacto 1 a 1 con el negocio.");
  else score += add("Sin teléfono público", 0, "Contacto solo presencial.", "negative");

  if (snapshot && snapshot.hotelCount >= 5 && snapshot.withoutWebsitePercent >= 40) {
    score += add("Mercado local poco digitalizado", 10, `${snapshot.withoutWebsitePercent}% sin web en ${snapshot.city}: diferenciarse es fácil.`);
  }

  if (lead.webAudit?.pageSpeedScores && lead.webAudit.pageSpeedScores.performance < 50) {
    score += add("Web lenta en móvil", 5, "Pierde huéspedes que reservan desde el celular.");
  }

  return { score: Math.min(100, score), eligible: true, breakdown };
}

export function topProspects(leads: BusinessLead[], city: string, snapshot: CitySnapshot | undefined, n = 12) {
  return leads
    .filter((l) => leadInCity(l, city) && !l.doNotContact && l.status !== "DESCARTADO" && l.status !== "CLIENTE")
    .map((lead) => ({ lead, result: calculateHotelScore(lead, snapshot) }))
    .filter((x) => x.result.eligible)
    .sort((a, b) => b.result.score - a.result.score || b.lead.userRatingCount - a.lead.userRatingCount)
    .slice(0, Math.max(1, Math.min(n, 15)));
}
