import { WebsiteType } from "@/types/lead";

interface DetectionResult {
  type: WebsiteType;
  platform?: string;
  isSocialOnly: boolean;
}

const SOCIAL_PATTERNS: Array<{ platform: string; regex: RegExp }> = [
  { platform: "Facebook", regex: /(facebook\.com|fb\.com|fb\.me)/i },
  { platform: "Instagram", regex: /(instagram\.com|instagr\.am)/i },
  { platform: "TikTok", regex: /(tiktok\.com)/i },
  { platform: "Linktree", regex: /(linktr\.ee|linktree)/i },
  { platform: "Beacons", regex: /(beacons\.ai)/i },
  { platform: "Bio.link", regex: /(bio\.link|bio\.site|solo\.to)/i },
  { platform: "Twitter/X", regex: /(twitter\.com|x\.com)/i },
  { platform: "WhatsApp", regex: /(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)/i },
  { platform: "YouTube", regex: /(youtube\.com|youtu\.be)/i },
  { platform: "LinkedIn", regex: /(linkedin\.com)/i },
  // Directorios que no son web propia
  { platform: "Directorio (Páginas Amarillas)", regex: /(paginasamarillas|yellowpages)/i },
  { platform: "Directorio (Yelp)", regex: /(yelp\.com)/i },
  { platform: "Directorio (Doctoralia)", regex: /(doctoralia)/i },
  { platform: "Directorio (Habitissimo)", regex: /(habitissimo)/i },
  { platform: "Directorio (TripAdvisor)", regex: /(tripadvisor)/i },
  { platform: "Directorio (Bodas.net)", regex: /(bodas\.net)/i },
];

export function detectWebsiteType(url?: string | null): DetectionResult {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return {
      type: "NONE",
      isSocialOnly: false,
    };
  }

  const cleanUrl = url.trim().toLowerCase();

  for (const item of SOCIAL_PATTERNS) {
    if (item.regex.test(cleanUrl)) {
      return {
        type: "SOCIAL_MEDIA",
        platform: item.platform,
        isSocialOnly: true,
      };
    }
  }

  return {
    type: "CUSTOM_WEBSITE",
    isSocialOnly: false,
  };
}
