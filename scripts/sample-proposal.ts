/** Genera una propuesta de EJEMPLO con datos ficticios: npx tsx scripts/sample-proposal.ts [salida.pdf] */
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { BusinessLead } from "../types/lead";
import { buildCitySnapshot } from "../lib/proposal/snapshot";
import { buildTemplateProposal } from "../lib/proposal/template";
import { proposalToPdf, proposalToDocx } from "../lib/proposal/export";
import { DEFAULT_BRAND } from "../lib/proposal/brand";

const base = (i: number, p: Partial<BusinessLead>): BusinessLead => ({
  id: "demo-" + i, name: `Hospedaje Ficticio ${i}`, category: "Hostal", formattedAddress: `Jr. Inventado ${i}, Ayacucho 05001, Perú`,
  websiteType: i % 3 === 0 ? "CUSTOM_WEBSITE" : i % 3 === 1 ? "NONE" : "SOCIAL_MEDIA", googleRating: 3.9 + (i % 8) / 10,
  userRatingCount: 10 + i * 9, googleMapsUrl: "", businessStatus: "OPERATIONAL", isSpanishTarget: true, preliminaryScore: 0,
  scoreBreakdown: [], status: "NUEVO", notes: "", ...p,
});
const market = Array.from({ length: 14 }, (_, i) => base(i + 1, {}));
const lead = base(0, {
  name: "Hostal Los Andes (EJEMPLO FICTICIO)", formattedAddress: "Jr. Ejemplo 000, Ayacucho 05001, Perú (dirección ficticia)",
  websiteType: "SOCIAL_MEDIA", socialNetworkDetected: "Facebook", googleRating: 4.3, userRatingCount: 87,
});
const snapshot = buildCitySnapshot([lead, ...market], "Ayacucho");
const p = { ...buildTemplateProposal({ lead, snapshot, seller: { fullName: "Jose Rivas", brandName: DEFAULT_BRAND.name } }), isExample: true };
const logoBytes = new Uint8Array(readFileSync(path.join(__dirname, "../public/brand/logo.jpg")));
const meta = { lead, sellerName: "Jose Rivas", brand: DEFAULT_BRAND, logoBytes };
const out = process.argv[2] || "propuesta-ejemplo.pdf";
(async () => {
  writeFileSync(out, await proposalToPdf(p, meta));
  writeFileSync(out.replace(/\.pdf$/, ".docx"), await proposalToDocx(p, meta));
  console.log("OK", out);
})();
