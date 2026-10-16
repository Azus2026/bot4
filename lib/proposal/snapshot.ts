import { BusinessLead, CitySnapshot } from "@/types/lead";
import { isHotelLead, leadInCity, extractCity } from "./hotel";

const round1 = (n: number) => Math.round(n * 10) / 10;
const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100));

/** Foto del mercado local calculada SOLO con datos ya obtenidos vía Google Places API oficial. */
export function buildCitySnapshot(leads: BusinessLead[], city: string): CitySnapshot {
  const inCity = leads.filter((l) => leadInCity(l, city) && l.businessStatus === "OPERATIONAL");
  const hotels = inCity.filter(isHotelLead);
  const base = hotels.length > 0 ? hotels : inCity;
  const n = base.length;
  const sum = (f: (l: BusinessLead) => number) => base.reduce((s, l) => s + f(l), 0);
  const rated = base.filter((l) => l.googleRating > 0);
  return {
    city,
    totalBusinesses: inCity.length,
    hotelCount: hotels.length,
    averageRating: rated.length ? round1(rated.reduce((s, l) => s + l.googleRating, 0) / rated.length) : 0,
    averageReviews: n ? Math.round(sum((l) => l.userRatingCount || 0) / n) : 0,
    withoutWebsitePercent: pct(base.filter((l) => l.websiteType !== "CUSTOM_WEBSITE").length, n),
    socialOnlyPercent: pct(base.filter((l) => l.websiteType === "SOCIAL_MEDIA").length, n),
    withPhonePercent: pct(base.filter((l) => !!(l.phone || l.internationalPhone)).length, n),
    topCompetitors: [...base]
      .sort((a, b) => b.userRatingCount - a.userRatingCount)
      .slice(0, 5)
      .map((l) => ({ name: l.name, rating: l.googleRating, reviews: l.userRatingCount, hasWebsite: l.websiteType === "CUSTOM_WEBSITE" })),
    generatedAt: new Date().toISOString(),
  };
}

export function listCities(leads: BusinessLead[]): { city: string; count: number }[] {
  const m = new Map<string, number>();
  for (const l of leads) {
    const c = extractCity(l.formattedAddress);
    m.set(c, (m.get(c) || 0) + 1);
  }
  return [...m.entries()].map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count);
}
