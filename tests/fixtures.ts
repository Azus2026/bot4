import { BusinessLead } from "@/types/lead";
export function mkLead(p: Partial<BusinessLead> = {}): BusinessLead {
  return {
    id: p.id || Math.random().toString(36).slice(2),
    name: "Hostal Demo",
    category: "Hostal",
    formattedAddress: "Jr. Ejemplo 123, Ayacucho 05001, Perú",
    websiteType: "NONE",
    googleRating: 4.2,
    userRatingCount: 48,
    googleMapsUrl: "https://maps.google.com/?q=demo",
    businessStatus: "OPERATIONAL",
    isSpanishTarget: true,
    preliminaryScore: 0,
    scoreBreakdown: [],
    status: "NUEVO",
    notes: "",
    phone: "066 000000",
    ...p,
  };
}
