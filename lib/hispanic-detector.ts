const LATAM_COUNTRIES = [
  "AR", "BO", "CL", "CO", "CR", "CU", "DO", "EC", "SV", "GT",
  "HN", "MX", "NI", "PA", "PY", "PE", "PR", "UY", "VE", "ES"
];

const SPANISH_KEYWORDS = [
  // Términos comerciales y prefijos
  "hispano", "hispana", "hispanos", "hispanas", "latino", "latina", "latinos", "latinas",
  "taller", "mecanico", "mecanica", "clinica", "dental", "dentista", "peluqueria", "estetica",
  "restaurante", "taqueria", "carniceria", "panaderia", "bodega", "tortilleria", "tienda",
  "abogado", "abogados", "seguros", "reformas", "construccion", "inmobiliaria", "veterinario",
  "fisioterapia", "academia", "autoescuela", "farmacia", "hermanos", "familia", "servicios",
  "antojitos", "mariscos", "pupusas", "arepas", "empanadas", "cantina", "barberia",
  // Palabras comunes en nombres hispanos
  "garcia", "rodriguez", "martinez", "hernandez", "lopez", "gonzalez", "perez", "sanchez",
  "ramirez", "torres", "flores", "rivera", "gomez", "diaz", "reyes", "morales", "castillo",
  "alvarez", "romero", "gutierrez", "rivas", "ortiz", "medina", "vargas", "mendoza"
];

export function isSpanishNativeCountry(countryCode: string): boolean {
  return LATAM_COUNTRIES.includes(countryCode.toUpperCase());
}

export function evaluateHispanicRelevance(
  name: string,
  category: string,
  address: string,
  countryCode: string,
  websiteUrl?: string
): { isSpanishTarget: boolean; confidence: "high" | "medium" | "low" } {
  const upperCountry = countryCode.toUpperCase();

  // Si es un país hispanohablante nativo (LATAM o España)
  if (isSpanishNativeCountry(upperCountry)) {
    return {
      isSpanishTarget: true,
      confidence: "high",
    };
  }

  // Si es EE.UU. u otro país no hispanohablante
  const textToScan = `${name} ${category} ${address} ${websiteUrl || ""}`.toLowerCase();
  
  let matchCount = 0;
  for (const keyword of SPANISH_KEYWORDS) {
    if (textToScan.includes(keyword)) {
      matchCount++;
    }
  }

  if (matchCount >= 2) {
    return {
      isSpanishTarget: true,
      confidence: "high",
    };
  }

  if (matchCount === 1) {
    return {
      isSpanishTarget: true,
      confidence: "medium",
    };
  }

  // Si la URL tiene dominio .es, .mx, etc. o /es/
  if (websiteUrl && /(\.es|\.mx|\.co|\.ar|\.cl|\/es\/|\/es$)/i.test(websiteUrl)) {
    return {
      isSpanishTarget: true,
      confidence: "medium",
    };
  }

  return {
    isSpanishTarget: false,
    confidence: "low",
  };
}
