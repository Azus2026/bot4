export interface ProposalBrand {
  name: string;
  logoUrl: string; // ruta en /public (JPG o PNG)
  colors: { dark: string; primary: string; secondary: string; silver: string };
}

/** Marca por defecto (configurable en Ajustes/Propuestas). Logo recortado sin la marca de agua. */
export const DEFAULT_BRAND: ProposalBrand = {
  name: "Dyad Finance",
  logoUrl: "/brand/logo.jpg",
  colors: { dark: "#0E1424", primary: "#2F80FF", secondary: "#7B5CFF", silver: "#C9CED6" },
};

export function hexToRgb01(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0, 0, 0];
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
