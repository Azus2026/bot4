import { NextRequest, NextResponse } from "next/server";
import { detectWebsiteType } from "@/lib/social-detector";
import { evaluateHispanicRelevance, isSpanishNativeCountry } from "@/lib/hispanic-detector";
import { calculatePreliminaryScore } from "@/lib/scoring";
import { BusinessLead } from "@/types/lead";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      query,
      regionCode = "ES",
      countryName = "España",
      filterSpanish = false,
      pageToken,
      apiKey: clientApiKey,
    } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "El parámetro 'query' es obligatorio." }, { status: 400 });
    }

    const apiKey =
      process.env.GOOGLE_CLOUD_API_KEY ||
      process.env.GOOGLE_PLACES_API_KEY ||
      clientApiKey;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "No se ha encontrado una API Key de Google Cloud. Por favor agrégala en la pantalla de Ajustes o en el archivo .env.local",
        },
        { status: 401 }
      );
    }

    // Heurística de búsqueda para audiencias hispanas en EE.UU. o Europa no nativa
    let refinedQuery = query.trim();
    const isNonSpanishRegion = !isSpanishNativeCountry(regionCode);

    if (filterSpanish && isNonSpanishRegion) {
      refinedQuery = `${refinedQuery} hispanos en español`;
    }

    const fieldMask = [
      "places.id",
      "places.displayName",
      "places.formattedAddress",
      "places.location",
      "places.nationalPhoneNumber",
      "places.internationalPhoneNumber",
      "places.websiteUri",
      "places.rating",
      "places.userRatingCount",
      "places.primaryTypeDisplayName",
      "places.types",
      "places.googleMapsUri",
      "places.businessStatus",
      "nextPageToken",
    ].join(",");

    const payload: Record<string, any> = {
      textQuery: refinedQuery,
      languageCode: "es",
      regionCode: regionCode.toUpperCase(),
      pageSize: 20,
    };

    if (pageToken) {
      payload.pageToken = pageToken;
    }

    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const detailedMessage =
        errorJson?.error?.message ||
        `Error de Google Places API: ${response.status} ${response.statusText}`;
      return NextResponse.json({ error: detailedMessage, rawError: errorJson }, { status: response.status });
    }

    const data = await response.json();
    const placesRaw = data.places || [];

    const leads: BusinessLead[] = placesRaw.map((place: any) => {
      const name = place.displayName?.text || "Sin nombre";
      const category = place.primaryTypeDisplayName?.text || place.types?.[0] || "Comercio Local";
      const formattedAddress = place.formattedAddress || "Dirección no disponible";
      const websiteUri = place.websiteUri || undefined;
      const googleRating = Number(place.rating || 0);
      const userRatingCount = Number(place.userRatingCount || 0);

      // Detectar si la web es propia o solo red social
      const websiteInfo = detectWebsiteType(websiteUri);

      // Evaluar relevancia hispana
      const hispanicEval = evaluateHispanicRelevance(
        name,
        category,
        formattedAddress,
        regionCode,
        websiteUri
      );

      // Calcular puntuación preliminar (0 a 80)
      const { score, breakdown } = calculatePreliminaryScore({
        websiteType: websiteInfo.type,
        userRatingCount,
        googleRating,
      });

      return {
        id: place.id,
        name,
        category,
        formattedAddress,
        location: place.location
          ? {
              lat: place.location.latitude,
              lng: place.location.longitude,
            }
          : undefined,
        phone: place.nationalPhoneNumber || place.internationalPhoneNumber || undefined,
        internationalPhone: place.internationalPhoneNumber || undefined,
        websiteUri,
        websiteType: websiteInfo.type,
        socialNetworkDetected: websiteInfo.platform,
        googleRating,
        userRatingCount,
        googleMapsUrl: place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + formattedAddress)}`,
        businessStatus: place.businessStatus || "OPERATIONAL",
        isSpanishTarget: hispanicEval.isSpanishTarget,
        spanishConfidence: hispanicEval.confidence,
        preliminaryScore: score,
        scoreBreakdown: breakdown,
        status: "NUEVO",
        notes: "",
      };
    });

    // Ordenamiento: Primero los hispanos, luego por Score de oportunidad descendente
    leads.sort((a, b) => {
      if (a.isSpanishTarget && !b.isSpanishTarget) return -1;
      if (!a.isSpanishTarget && b.isSpanishTarget) return 1;
      return b.preliminaryScore - a.preliminaryScore;
    });

    return NextResponse.json({
      places: leads,
      nextPageToken: data.nextPageToken || null,
      totalCount: leads.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error interno del servidor procesando la búsqueda de Google Places" },
      { status: 500 }
    );
  }
}
