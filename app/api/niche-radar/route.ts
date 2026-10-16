import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { detectWebsiteType } from "@/lib/social-detector";
import { evaluateHispanicRelevance, isSpanishNativeCountry } from "@/lib/hispanic-detector";
import { NicheOpportunityStat, NicheRadarResult } from "@/types/lead";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      zone,
      countryCode = "ES",
      categories = [],
      filterSpanish = false,
      apiKey: clientApiKey,
      geminiApiKey: clientGeminiKey,
    } = body;

    if (!zone || !Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: "La zona y al menos una categoría son obligatorias." },
        { status: 400 }
      );
    }

    const googleKey =
      process.env.GOOGLE_CLOUD_API_KEY ||
      process.env.GOOGLE_PLACES_API_KEY ||
      clientApiKey;

    const geminiKey =
      process.env.GEMINI_API_KEY ||
      clientGeminiKey ||
      googleKey;

    if (!googleKey) {
      return NextResponse.json(
        { error: "Se requiere la API Key de Google Cloud para consultar Places." },
        { status: 401 }
      );
    }

    const fieldMask = [
      "places.id",
      "places.displayName",
      "places.websiteUri",
      "places.rating",
      "places.userRatingCount",
    ].join(",");

    const isNonSpanishRegion = !isSpanishNativeCountry(countryCode);
    const stats: NicheOpportunityStat[] = [];

    // Consultar cada categoría
    for (const category of categories) {
      let queryText = `${category} en ${zone}`;
      if (filterSpanish && isNonSpanishRegion) {
        queryText = `${category} hispanos en ${zone}`;
      }

      try {
        const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": googleKey,
            "X-Goog-FieldMask": fieldMask,
          },
          body: JSON.stringify({
            textQuery: queryText,
            languageCode: "es",
            regionCode: countryCode.toUpperCase(),
            pageSize: 20,
          }),
        });

        if (!response.ok) {
          stats.push({
            category,
            totalFound: 0,
            withoutWebsiteCount: 0,
            withoutWebsitePercent: 0,
            socialOnlyCount: 0,
            socialOnlyPercent: 0,
            averageRating: 0,
            averageReviews: 0,
            opportunityRating: 0,
            recommendedService: "No disponible",
            estimatedPlacesCalls: 1,
          });
          continue;
        }

        const data = await response.json();
        const places = data.places || [];
        const total = places.length;

        if (total === 0) {
          stats.push({
            category,
            totalFound: 0,
            withoutWebsiteCount: 0,
            withoutWebsitePercent: 0,
            socialOnlyCount: 0,
            socialOnlyPercent: 0,
            averageRating: 0,
            averageReviews: 0,
            opportunityRating: 0,
            recommendedService: "Sin negocios",
            estimatedPlacesCalls: 1,
          });
          continue;
        }

        let withoutWeb = 0;
        let socialOnly = 0;
        let ratingSum = 0;
        let reviewsSum = 0;

        for (const p of places) {
          const webInfo = detectWebsiteType(p.websiteUri);
          if (webInfo.type === "NONE") {
            withoutWeb++;
          } else if (webInfo.type === "SOCIAL_MEDIA") {
            socialOnly++;
          }

          ratingSum += Number(p.rating || 0);
          reviewsSum += Number(p.userRatingCount || 0);
        }

        const withoutWebPercent = Math.round((withoutWeb / total) * 100);
        const socialOnlyPercent = Math.round((socialOnly / total) * 100);
        const avgRating = Number((ratingSum / total).toFixed(1));
        const avgReviews = Math.round(reviewsSum / total);

        // Algoritmo preliminar de oportunidad de nicho:
        // A más negocios sin web y buen flujo de reseñas, mayor oportunidad
        const opportunityScore = Math.min(
          100,
          Math.round(
            (withoutWebPercent + socialOnlyPercent) * 0.6 +
              (avgReviews > 30 ? 25 : avgReviews > 10 ? 15 : 5) +
              (avgRating >= 4.0 ? 15 : 5)
          )
        );

        stats.push({
          category,
          totalFound: total,
          withoutWebsiteCount: withoutWeb,
          withoutWebsitePercent: withoutWebPercent,
          socialOnlyCount: socialOnly,
          socialOnlyPercent: socialOnlyPercent,
          averageRating: avgRating,
          averageReviews: avgReviews,
          opportunityRating: opportunityScore,
          recommendedService:
            withoutWebPercent > 40
              ? "Página Web de Alta Velocidad"
              : avgReviews > 40
              ? "Agente de WhatsApp IA"
              : "Sistema de Citas Online",
          estimatedPlacesCalls: 1,
        });
      } catch (err) {
        console.error(`Error consultando nicho ${category}:`, err);
      }
    }

    // Ordenar de mayor a menor oportunidad
    stats.sort((a, b) => b.opportunityRating - a.opportunityRating);

    let top3Recommendation: any[] = [];
    let geminiExecutiveSummary = "";

    // Si hay clave de Gemini, obtener veredicto estratégico
    if (geminiKey && stats.length > 0) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const candidateModels = ["gemini-3.8-flash", "gemini-3.8-pro"];

        const prompt = `
Eres un estratega de prospección comercial B2B.
Analiza la siguiente matriz de datos recolectados de negocios locales en "${zone}" (${countryCode}):

${JSON.stringify(stats, null, 2)}

Tu tarea:
1. Selecciona las 3 MEJORES categorías para prospección activa inmediata.
2. Explica brevemente por qué cada una tiene el mayor potencial de cierre y facturación.
3. Especifica el servicio digital exacto que el consultor debe vender en esa categoría (ej. "Página Web Moderna", "Agente de WhatsApp IA", "Sistema de Citas").
4. Genera un breve resumen ejecutivo en 2 párrafos para orientar la estrategia del día.

Responde ÚNICAMENTE en este JSON:
{
  "top3": [
    {
      "category": "string",
      "why": "string",
      "serviceToSell": "string"
    }
  ],
  "executiveSummary": "string"
}
`;

        let result = null;
        for (const modelName of candidateModels) {
          try {
            const model = genAI.getGenerativeModel({
              model: modelName,
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.3,
              },
            });

            for (let attempt = 1; attempt <= 3; attempt++) {
              try {
                result = await model.generateContent(prompt);
                if (result) break;
              } catch (callErr: any) {
                const msg = callErr?.message || "";
                const isTransient = msg.includes("503") || msg.includes("429") || msg.includes("high demand") || msg.includes("Service Unavailable");
                if (isTransient && attempt < 3) {
                  await new Promise((res) => setTimeout(res, attempt * 1500));
                  continue;
                }
                throw callErr;
              }
            }

            if (result) break;
          } catch (mErr) {
            console.warn(`Modelo ${modelName} falló en niche-radar:`, mErr);
          }
        }

        if (result) {
          const parsed = JSON.parse(result.response.text());
          top3Recommendation = parsed.top3 || [];
          geminiExecutiveSummary = parsed.executiveSummary || "";
        }
      } catch (geminiErr) {
        console.warn("Fallo análisis de nichos con Gemini:", geminiErr);
      }
    }

    const responsePayload: NicheRadarResult = {
      zone,
      country: countryCode,
      stats,
      top3Recommendation,
      geminiExecutiveSummary,
      analyzedAt: new Date().toISOString(),
    };

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error procesando el Radar de Nichos." },
      { status: 500 }
    );
  }
}
