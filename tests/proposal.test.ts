import { describe, it, expect } from "vitest";
import { mkLead } from "./fixtures";
import { calculateHotelScore, extractCity, isHotelLead, topProspects } from "@/lib/proposal/hotel";
import { buildCitySnapshot, listCities } from "@/lib/proposal/snapshot";
import { buildTemplateProposal, mergeAiProposal, DEFAULT_PROPOSAL_PRICING } from "@/lib/proposal/template";
import { checkStatusTransition } from "@/lib/proposal/workflow";
import { proposalToPdf, proposalToDocx, toWinAnsi } from "@/lib/proposal/export";

const seller = { fullName: "Jose Rivas", brandName: "Dyad Finance" };

describe("ciudad y rubro", () => {
  it("extrae la ciudad de direcciones de Google", () => {
    expect(extractCity("Jr. Lima 123, Ayacucho 05001, Perú")).toBe("Ayacucho");
    expect(extractCity("Av. Sol 10, Cusco 08002, Peru")).toBe("Cusco");
  });
  it("detecta hospedajes", () => {
    expect(isHotelLead({ category: "Hotel", name: "X" })).toBe(true);
    expect(isHotelLead({ category: "Restaurante", name: "Pollería" })).toBe(false);
  });
});

describe("score hotelero", () => {
  it("excluye no contactar y cerrados", () => {
    expect(calculateHotelScore(mkLead({ doNotContact: true })).eligible).toBe(false);
    expect(calculateHotelScore(mkLead({ businessStatus: "CLOSED_PERMANENTLY" })).eligible).toBe(false);
  });
  it("prioriza hostal sin web frente a hotel con web y motor de reservas", () => {
    const a = calculateHotelScore(mkLead()).score;
    const b = calculateHotelScore(
      mkLead({ websiteType: "CUSTOM_WEBSITE", userRatingCount: 900, googleRating: 4.9,
        webAudit: { analysis: { checklist: { hasBooking: true, hasHttps: true, isMobileFriendly: true, hasWhatsApp: true, hasContactForm: true, isOutdated: false } } } as any })
    ).score;
    expect(a).toBeGreaterThan(b);
    expect(a).toBeLessThanOrEqual(100);
  });
  it("topProspects limita a 15 y filtra ciudad/no contactar", () => {
    const leads = [
      ...Array.from({ length: 20 }, (_, i) => mkLead({ id: "a" + i })),
      mkLead({ id: "dnc", doNotContact: true }),
      mkLead({ id: "cus", formattedAddress: "Calle 1, Cusco 08000, Perú" }),
    ];
    const r = topProspects(leads, "Ayacucho", undefined, 50);
    expect(r.length).toBe(15);
    expect(r.some((x) => x.lead.id === "dnc" || x.lead.id === "cus")).toBe(false);
  });
});

describe("snapshot de mercado", () => {
  it("calcula métricas por ciudad", () => {
    const leads = [mkLead({ googleRating: 4 }), mkLead({ websiteType: "CUSTOM_WEBSITE", googleRating: 5, userRatingCount: 100 }), mkLead({ formattedAddress: "x, Cusco 1, Perú" })];
    const s = buildCitySnapshot(leads, "Ayacucho");
    expect(s.hotelCount).toBe(2);
    expect(s.withoutWebsitePercent).toBe(50);
    expect(s.averageRating).toBe(4.5);
    expect(listCities(leads)[0]).toEqual({ city: "Ayacucho", count: 2 });
  });
});

describe("propuesta", () => {
  it("plantilla determinista con precios y WhatsApp con opción de baja", () => {
    const p = buildTemplateProposal({ lead: mkLead(), seller, snapshot: buildCitySnapshot([mkLead()], "Ayacucho") });
    expect(p.generatedBy).toBe("template");
    expect(p.pricing.setupMin).toBe(800);
    expect(p.pricing.plans.map((x) => x.monthlyPrice)).toEqual([89, 169, 299]);
    expect(p.whatsappDraft).toMatch(/no vuelvo a contactarle/);
    expect(p.recommendedPlan).toBe("Pro");
  });
  it("mergeAiProposal ignora campos inválidos y planes inexistentes", () => {
    const fb = buildTemplateProposal({ lead: mkLead(), seller });
    const m = mergeAiProposal({ title: "T", diagnosis: [1, 2], recommendedPlan: "Oro" }, fb);
    expect(m.title).toBe("T");
    expect(m.diagnosis).toEqual(fb.diagnosis);
    expect(m.recommendedPlan).toBe(fb.recommendedPlan);
    expect(m.pricing).toEqual(DEFAULT_PROPOSAL_PRICING);
  });
  it("exporta PDF y DOCX válidos", async () => {
    const p = buildTemplateProposal({ lead: mkLead(), seller });
    const pdf = await proposalToPdf(p, { lead: mkLead(), sellerName: "Jose Rivas" });
    expect(Buffer.from(pdf.slice(0, 4)).toString()).toBe("%PDF");
    const docx = await proposalToDocx(p, { lead: mkLead(), sellerName: "Jose Rivas" });
    expect(Buffer.from(docx.slice(0, 2)).toString()).toBe("PK");
    expect(toWinAnsi("Hola 🚀 “ñ”")).toBe('Hola  "ñ"');
  });
});

describe("flujo de aprobación", () => {
  it("bloquea contactar sin aprobación y respeta no contactar", () => {
    const p = buildTemplateProposal({ lead: mkLead(), seller });
    const lead = mkLead({ status: "PROPUESTA_LISTA", proposal: p });
    expect(checkStatusTransition(lead, "CONTACTADO")).toMatch(/aprobarse/);
    expect(checkStatusTransition({ ...lead, proposal: { ...p, approvedAt: "x" } }, "CONTACTADO")).toBeNull();
    expect(checkStatusTransition(mkLead(), "PROPUESTA_LISTA")).toMatch(/genera/);
    expect(checkStatusTransition(mkLead({ doNotContact: true }), "CONTACTADO")).toMatch(/No contactar/);
  });
});
