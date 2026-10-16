import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BusinessLead, CitySnapshot, ProposalPricing, SellerProfile } from "@/types/lead";
import { buildTemplateProposal, mergeAiProposal, DEFAULT_PROPOSAL_PRICING, DEFAULT_CASE_STUDY } from "@/lib/proposal/template";

/**
 * Genera una propuesta comercial personalizada (BORRADOR). Nunca envía mensajes:
 * devuelve texto para revisión humana. Si no hay clave de Gemini o falla, usa la plantilla determinista.
 */
export async function POST(req: NextRequest) {
  let body: {
    lead: BusinessLead;
    snapshot?: CitySnapshot;
    sellerProfile?: Partial<SellerProfile>;
    pricing?: ProposalPricing;
    caseStudy?: string;
    geminiApiKey?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  const { lead, snapshot, sellerProfile, pricing, caseStudy } = body;
  if (!lead?.name) return NextResponse.json({ error: "Faltan datos del lead." }, { status: 400 });
  if (lead.doNotContact) return NextResponse.json({ error: "Este negocio está marcado como 'No contactar'." }, { status: 409 });

  const seller = { fullName: sellerProfile?.fullName || "Jose Rivas", brandName: sellerProfile?.brandName || "" };
  const input = { lead, snapshot, seller, pricing: pricing || DEFAULT_PROPOSAL_PRICING, caseStudy: caseStudy || DEFAULT_CASE_STUDY };
  const fallback = buildTemplateProposal(input);

  const key = body.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ success: true, data: fallback, warning: "Sin clave de Gemini: se usó la plantilla." });

  const prompt = `Eres un consultor comercial peruano que redacta propuestas para pequeños hoteles y negocios locales.
Escribe en español de Perú, tono cercano, profesional y honesto. No inventes cifras que no estén en los datos. Nada de promesas exageradas.
El vendedor hace trabajo personalizado y busca pocos clientes de calidad: la propuesta debe sentirse hecha a mano para este negocio.

NEGOCIO: ${JSON.stringify({
    nombre: lead.name, rubro: lead.category, direccion: lead.formattedAddress, rating: lead.googleRating, resenas: lead.userRatingCount,
    web: lead.websiteType, red: lead.socialNetworkDetected, pagespeed: lead.webAudit?.pageSpeedScores, checklist: lead.webAudit?.analysis.checklist,
    problemas: lead.webAudit?.analysis.painPoints, resumen: lead.webAudit?.analysis.summary,
  })}
MERCADO LOCAL (datos públicos de Google Places): ${JSON.stringify(snapshot || null)}
CASO DE ÉXITO: ${input.caseStudy}
PRECIOS (no los cambies): ${JSON.stringify(input.pricing)}
VENDEDOR: ${seller.fullName} ${seller.brandName}

Devuelve SOLO JSON: {"title": string, "executiveSummary": string (3-4 frases), "diagnosis": string[3-5], "marketContext": string[2-3] (usa cifras del mercado local),
"solution": string[4-5], "recommendedPlan": uno de ${JSON.stringify(input.pricing.plans.map((p) => p.name))}, "roiEstimate": string, "nextSteps": string[3-4],
"whatsappDraft": string (máx 4 párrafos cortos, se presenta, menciona un dato concreto del negocio, ofrece enviar el PDF, e incluye la frase de que si prefiere no recibir mensajes no volverá a escribir)}`;

  try {
    const model = new GoogleGenerativeAI(key).getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.5 },
    });
    const result = await model.generateContent(prompt);
    const data = mergeAiProposal(JSON.parse(result.response.text()), fallback);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.warn("[proposal] Gemini falló, usando plantilla:", err?.message);
    return NextResponse.json({ success: true, data: fallback, warning: "Gemini no respondió: se usó la plantilla." });
  }
}
