import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BusinessLead, OutreachTone, SellerProfile } from "@/types/lead";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      lead,
      sellerProfile,
      pageSpeedScores,
      tone = "CONSULTIVE",
      apiKey: clientApiKey,
      geminiApiKey: clientGeminiKey,
    }: {
      lead: BusinessLead;
      sellerProfile: SellerProfile;
      pageSpeedScores?: {
        performance: number;
        seo: number;
        accessibility: number;
        bestPractices: number;
      };
      tone: OutreachTone;
      apiKey?: string;
      geminiApiKey?: string;
    } = body;

    if (!lead || !lead.name) {
      return NextResponse.json({ error: "Faltan datos del lead a analizar." }, { status: 400 });
    }

    const geminiKey =
      clientGeminiKey ||
      process.env.GEMINI_API_KEY ||
      clientApiKey ||
      process.env.GOOGLE_CLOUD_API_KEY;

    if (!geminiKey) {
      return NextResponse.json(
        {
          error:
            "No se ha encontrado la clave de Gemini. Configura tu clave de Google AI Studio en Ajustes ➔ Gemini API Key.",
        },
        { status: 401 }
      );
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const candidateModels = ["gemini-3.8-flash", "gemini-3.8-pro"];

    const hasWebsite = lead.websiteType === "CUSTOM_WEBSITE" && !!lead.websiteUri;
    const isSocialOnly = lead.websiteType === "SOCIAL_MEDIA";

    // Intentar leer texto de la web si existe
    let websiteDomSummary = "No posee página web propia.";
    if (hasWebsite && lead.websiteUri) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const webRes = await fetch(lead.websiteUri, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });
        clearTimeout(timeout);
        if (webRes.ok) {
          const html = await webRes.text();
          // Extracción rápida de texto visible sin scripts ni css
          const cleanText = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .slice(0, 4000);
          websiteDomSummary = cleanText;
        }
      } catch (err) {
        websiteDomSummary = `No se pudo obtener el contenido directamente de ${lead.websiteUri} (posible bloqueo CORS o timeout). Analizar por nombre y categoría.`;
      }
    } else if (isSocialOnly) {
      websiteDomSummary = `El negocio solo cuenta con un enlace a red social o directorio (${lead.socialNetworkDetected || "Red Social"}: ${lead.websiteUri}).`;
    }

    const prompt = `
Eres un analista de prospección comercial B2B para negocios locales y redactor de outreach de élite.
Tu misión es analizar este negocio, identificar fallas u oportunidades digitales reales, recomendar el mejor servicio y redactar 3 borradores personalizados en español neutro / LATAM.

DATOS DEL NEGOCIO PROSPECTO:
- Nombre: ${lead.name}
- Rubro / Categoría: ${lead.category}
- Dirección: ${lead.formattedAddress}
- Teléfono: ${lead.phone || "No especificado"}
- Tipo de Web: ${lead.websiteType} ${lead.socialNetworkDetected ? `(Plataforma: ${lead.socialNetworkDetected})` : ""}
- URL de la Web: ${lead.websiteUri || "Sin sitio web"}
- Reseñas Google: ${lead.userRatingCount} con valoración de ${lead.googleRating}★
- Puntuaciones de PageSpeed en móvil (si aplica): ${
      pageSpeedScores
        ? `Rendimiento: ${pageSpeedScores.performance}/100, SEO: ${pageSpeedScores.seo}/100, Accesibilidad: ${pageSpeedScores.accessibility}/100, Buenas Prácticas: ${pageSpeedScores.bestPractices}/100`
        : "Sin auditoría PageSpeed (no tiene web propia o no disponible)"
    }
- Extracto del contenido web rastreado:
"""
${websiteDomSummary}
"""

DATOS DEL CONSULTOR / VENDEDOR (Autoridad y Oferta):
- Nombre del Consultor: ${sellerProfile.fullName} (Jose Rivas)
- Marca: ${sellerProfile.brandName} (Hik)
- Trayectoria y Respaldo On-Chain Inmutable: ${sellerProfile.onchainTrackRecordUrl}
  * Métricas reales en blockchain auditadas por ZAPS: ${sellerProfile.volumeGenerated} generados, Clan Score ${sellerProfile.clanScore}, Top ${sellerProfile.globalRank} clanes globales, ${sellerProfile.zapsCount} ZAPS.
  * Argumento de confianza: "En blockchain los números no se pueden inventar ni comprar; cada transacción está verificada en la red."
- Servicios Digitales de Entrada:
  1. Páginas Web de Alta Conversión y Velocidad Móvil
  2. Agentes de Inteligencia Artificial para WhatsApp (Atención al cliente y captura de leads 24/7)
  3. Sistemas Automatizados de Citas y Reservas Online
- Programa de Inversión Fundador (Incentivo Exclusivo de Cierre):
  * ${sellerProfile.investorProgramTitle}: Beneficios prioritarios como primeros inversores.
  * Bono Adicional de Arquitectura: ${sellerProfile.specialIncentives}
- Tono solicitado: ${tone} (DIRECT: conciso y sin rodeos; CONSULTIVE: empático, analítico y profesional; DISRUPTIVE: audaz, resaltando números onchain y el costo de perder clientes frente a la competencia).

REGLAS DE RESPUESTA:
1. Resumen: Máximo 2 oraciones explicando exactamente a qué se dedica el negocio.
2. Checklist: Determinar con honestidad si tiene o no WhatsApp, citas, formularios, https, etc.
3. Puntos de dolor (3 a 5): Explicados en lenguaje llano de negocios (ej. "Pierdes 6 de cada 10 clientes móviles porque la web tarda más de 4 segundos en abrir").
4. Servicio recomendado: Elegir el que tenga mayor ROI inmediato para ese negocio (WEB_DEVELOPMENT, WHATSAPP_AGENT o BOOKING_SYSTEM).
5. Borradores:
   - whatsappMessage: Directo, conversacional, con saltos de línea legibles, mencionando un punto de dolor concreto y abriendo una conversación cordial.
   - coldCallScript30s: Guion de 30 segundos con gancho, prueba de autoridad y pregunta de cierre para agendar demo.
   - coldEmail: Asunto magnético y cuerpo estructurado con propuesta clara, mención del respaldo on-chain y el bono de inversión/planos 3D para fundadores.

Responde ÚNICAMENTE en formato JSON con la siguiente estructura exacta:
{
  "summary": "string",
  "checklist": {
    "hasHttps": boolean,
    "isMobileFriendly": boolean,
    "hasWhatsApp": boolean,
    "hasBooking": boolean,
    "hasContactForm": boolean,
    "copyrightYear": number,
    "isOutdated": boolean
  },
  "extractedEmails": ["string"],
  "extractedSocials": ["string"],
  "painPoints": [
    {
      "issue": "string",
      "impact": "string"
    }
  ],
  "suggestedService": "WEB_DEVELOPMENT" | "WHATSAPP_AGENT" | "BOOKING_SYSTEM",
  "serviceJustification": "string",
  "outreachDrafts": {
    "whatsapp": "string",
    "callScript": "string",
    "email": {
      "subject": "string",
      "body": "string"
    }
  }
}
`;

    let result = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        });

        // Intentar hasta 3 veces por modelo si Google devuelve 503 (alta demanda) o 429
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            result = await model.generateContent(prompt);
            if (result) break;
          } catch (callErr: any) {
            const msg = callErr?.message || "";
            const isTransient = msg.includes("503") || msg.includes("429") || msg.includes("high demand") || msg.includes("Service Unavailable");
            if (isTransient && attempt < 3) {
              console.warn(`[Gemini] Intento ${attempt} con ${modelName} falló por alta demanda. Esperando ${attempt * 1500}ms...`);
              await new Promise((res) => setTimeout(res, attempt * 1500));
              continue;
            }
            throw callErr;
          }
        }

        if (result) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Modelo ${modelName} falló:`, err?.message);
      }
    }

    if (!result) {
      throw lastError || new Error("No se pudo conectar con ningún modelo de Gemini.");
    }

    const responseText = result.response.text();
    const parsedJson = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      data: parsedJson,
    });
  } catch (error: any) {
    console.error("Error en Gemini API:", error);
    const errorMsg = error?.message || "";
    let friendlyError = errorMsg;

    if (errorMsg.includes("API_KEY_SERVICE_BLOCKED") || errorMsg.includes("403 Forbidden") || errorMsg.includes("blocked")) {
      friendlyError =
        "Tu clave actual de Google Cloud tiene restringida la API de Gemini. Por favor crea una clave en Google AI Studio (aistudio.google.com/app/apikey) y pégala en Ajustes ➔ Gemini API Key.";
    } else if (errorMsg.includes("503") || errorMsg.includes("high demand") || errorMsg.includes("Service Unavailable")) {
      friendlyError =
        "El servidor de Gemini 3.8 Flash de Google está experimentando alta demanda momentánea (503 Service Unavailable). Se reintentó automáticamente. Por favor vuelve a hacer clic en 'Iniciar Auditoría con IA' en unos segundos.";
    }

    return NextResponse.json(
      {
        error: friendlyError,
      },
      { status: 500 }
    );
  }
}
