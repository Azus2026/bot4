import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, apiKey: clientApiKey } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "La URL es obligatoria para ejecutar PageSpeed Insights." }, { status: 400 });
    }

    const apiKey =
      process.env.GOOGLE_CLOUD_API_KEY ||
      process.env.GOOGLE_PAGESPEED_API_KEY ||
      clientApiKey;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "No se ha encontrado una API Key de Google Cloud. Por favor agrégala en Ajustes o en el archivo .env.local",
        },
        { status: 401 }
      );
    }

    // Asegurar protocolo
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const apiUrl = new URL("https://pagespeedonline.googleapis.com/pagespeed/v1/runPagespeed");
    apiUrl.searchParams.set("url", formattedUrl);
    apiUrl.searchParams.set("strategy", "mobile");
    apiUrl.searchParams.append("category", "performance");
    apiUrl.searchParams.append("category", "seo");
    apiUrl.searchParams.append("category", "accessibility");
    apiUrl.searchParams.append("category", "best-practices");
    apiUrl.searchParams.set("key", apiKey);

    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const detailedMessage =
        errorJson?.error?.message ||
        `Error de PageSpeed API: ${response.status} ${response.statusText}`;
      return NextResponse.json({ error: detailedMessage, rawError: errorJson }, { status: response.status });
    }

    const data = await response.json();
    const lighthouse = data.lighthouseResult;

    if (!lighthouse || !lighthouse.categories) {
      return NextResponse.json(
        { error: "PageSpeed Insights no devolvió resultados válidos para esta web." },
        { status: 502 }
      );
    }

    const scores = {
      performance: Math.round((lighthouse.categories.performance?.score || 0) * 100),
      seo: Math.round((lighthouse.categories.seo?.score || 0) * 100),
      accessibility: Math.round((lighthouse.categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((lighthouse.categories["best-practices"]?.score || 0) * 100),
    };

    const screenshotBase64 = lighthouse.audits?.["final-screenshot"]?.details?.data || null;

    return NextResponse.json({
      scores,
      screenshotBase64,
      auditedUrl: formattedUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error al procesar la auditoría en PageSpeed Insights." },
      { status: 500 }
    );
  }
}
