import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType, ImageRun } from "docx";
import { ProposalData, BusinessLead } from "@/types/lead";
import { formatMoney } from "./template";
import { ProposalBrand, DEFAULT_BRAND, hexToRgb01 } from "./brand";

// Las fuentes estándar de PDF usan WinAnsi: reemplazamos caracteres no soportados (emojis, etc.).
export function toWinAnsi(s: string): string {
  return (s || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[\u2605]/g, "*")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF\u20AC\u2022]/g, "");
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of toWinAnsi(text).split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    lines.push(line);
  }
  return lines;
}

export interface ExportMeta {
  lead: Pick<BusinessLead, "name" | "formattedAddress">;
  sellerName: string;
  sellerBrand?: string;
  brand?: ProposalBrand;
  /** Bytes del logo (JPG/PNG). Opcional. */
  logoBytes?: Uint8Array;
}

function isPng(b: Uint8Array) {
  return b[0] === 0x89 && b[1] === 0x50;
}

export async function proposalToPdf(p: ProposalData, meta: ExportMeta): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(toWinAnsi(p.title));
  doc.setAuthor(toWinAnsi(meta.sellerName));
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const brand = meta.brand || DEFAULT_BRAND;
  const c = (h: string) => rgb(...hexToRgb01(h));
  const W = 595, H = 842, M = 50, accent = c(brand.colors.primary), violet = c(brand.colors.secondary);
  let page: PDFPage = doc.addPage([W, H]);
  let y = H - M;

  const ensure = (h: number) => {
    if (y - h < M + 20) {
      page = doc.addPage([W, H]);
      y = H - M;
    }
  };
  const text = (t: string, size = 10.5, f = font, color = rgb(0.15, 0.15, 0.15), indent = 0) => {
    for (const line of wrap(t, f, size, W - 2 * M - indent)) {
      ensure(size + 4);
      page.drawText(line, { x: M + indent, y, size, font: f, color });
      y -= size + 4;
    }
  };
  const heading = (t: string) => {
    y -= 8;
    ensure(30);
    page.drawRectangle({ x: M, y: y - 4, width: 4, height: 16, color: accent });
    page.drawText(toWinAnsi(t), { x: M + 10, y, size: 13, font: bold, color: accent });
    y -= 22;
  };
  const bullets = (items: string[]) => items.forEach((i) => text(`•  ${i}`, 10.5, font, undefined, 6));

  // Cabecera de marca: banda oscura + logo + nombre de marca + línea de acento azul/violeta
  const bandH = 90;
  page.drawRectangle({ x: 0, y: H - bandH, width: W, height: bandH, color: c(brand.colors.dark) });
  page.drawRectangle({ x: 0, y: H - bandH - 3, width: W / 2, height: 3, color: accent });
  page.drawRectangle({ x: W / 2, y: H - bandH - 3, width: W / 2, height: 3, color: violet });
  let tx = M;
  if (meta.logoBytes && meta.logoBytes.length > 0) {
    try {
      const img = isPng(meta.logoBytes) ? await doc.embedPng(meta.logoBytes) : await doc.embedJpg(meta.logoBytes);
      const h = 70, w = (img.width / img.height) * h;
      page.drawImage(img, { x: M, y: H - bandH + 10, width: w, height: h });
      tx = M + w + 14;
    } catch {
      /* logo inválido: se omite */
    }
  }
  page.drawText(toWinAnsi(brand.name.toUpperCase()), { x: tx, y: H - 45, size: 18, font: bold, color: c(brand.colors.silver) });
  page.drawText(toWinAnsi(`${meta.sellerName} · Propuesta comercial`), { x: tx, y: H - 63, size: 9.5, font, color: c(brand.colors.silver) });
  y = H - bandH - 28;
  if (p.isExample) {
    page.drawRectangle({ x: M, y: y - 6, width: W - 2 * M, height: 20, color: rgb(0.85, 0.2, 0.2) });
    page.drawText("EJEMPLO CON DATOS FICTICIOS - NO ES UN NEGOCIO REAL", { x: M + 8, y, size: 10, font: bold, color: rgb(1, 1, 1) });
    y -= 30;
  }
  text(p.title, 20, bold, rgb(0.1, 0.1, 0.1));
  text(meta.lead.formattedAddress, 9.5, font, rgb(0.4, 0.4, 0.4));
  text(`Fecha: ${new Date(p.generatedAt).toLocaleDateString("es-PE")}`, 9.5, font, rgb(0.4, 0.4, 0.4));

  heading("Resumen");
  text(p.executiveSummary);
  heading("Diagnóstico");
  bullets(p.diagnosis);
  heading("Contexto del mercado local");
  bullets(p.marketContext);
  heading("Solución propuesta");
  bullets(p.solution);

  heading("Inversión");
  text(`Implementación única (diseño a medida, configuración y capacitación): ${formatMoney(p.pricing, p.pricing.setupMin)} - ${formatMoney(p.pricing, p.pricing.setupMax)}`, 10.5, bold);
  y -= 4;
  for (const plan of p.pricing.plans) {
    const rec = plan.name === p.recommendedPlan;
    text(`${rec ? "> " : ""}Plan ${plan.name}: ${formatMoney(p.pricing, plan.monthlyPrice)}/mes${rec ? "  (recomendado)" : ""}`, 11, bold, rec ? violet : rgb(0.15, 0.15, 0.15));
    text(plan.features.join(" · "), 9.5, font, rgb(0.35, 0.35, 0.35), 12);
    y -= 2;
  }
  text(p.roiEstimate, 10, font, rgb(0.2, 0.2, 0.2));
  heading("Próximos pasos");
  bullets(p.nextSteps);

  const pages = doc.getPages();
  pages.forEach((pg, i) =>
    pg.drawText(toWinAnsi(`${brand.name} · ${meta.sellerName} · Propuesta confidencial · ${i + 1}/${pages.length}`), { x: M, y: 25, size: 8, font, color: rgb(0.5, 0.5, 0.5) })
  );
  return doc.save();
}

export async function proposalToDocx(p: ProposalData, meta: ExportMeta): Promise<Uint8Array> {
  const h = (t: string) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } });
  const para = (t: string, bold = false) => new Paragraph({ children: [new TextRun({ text: t, bold })], spacing: { after: 100 } });
  const bl = (items: string[]) => items.map((t) => new Paragraph({ text: t, bullet: { level: 0 } }));
  const brand = meta.brand || DEFAULT_BRAND;
  const children: Paragraph[] = [];
  if (meta.logoBytes && meta.logoBytes.length > 0) {
    children.push(new Paragraph({ children: [new ImageRun({ type: isPng(meta.logoBytes) ? "png" : "jpg", data: meta.logoBytes, transformation: { width: 140, height: 113 } })] }));
  }
  children.push(new Paragraph({ children: [new TextRun({ text: brand.name.toUpperCase(), bold: true, size: 32, color: brand.colors.primary.replace("#", "") })] }));
  if (p.isExample) children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "EJEMPLO CON DATOS FICTICIOS", bold: true, color: "CC0000" })] }));
  children.push(
    new Paragraph({ text: p.title, heading: HeadingLevel.TITLE }),
    para(meta.lead.formattedAddress),
    para(`${meta.sellerName}${meta.sellerBrand ? " · " + meta.sellerBrand : ""} — ${new Date(p.generatedAt).toLocaleDateString("es-PE")}`),
    h("Resumen"), para(p.executiveSummary),
    h("Diagnóstico"), ...bl(p.diagnosis),
    h("Contexto del mercado local"), ...bl(p.marketContext),
    h("Solución propuesta"), ...bl(p.solution),
    h("Inversión"),
    para(`Implementación única: ${formatMoney(p.pricing, p.pricing.setupMin)} - ${formatMoney(p.pricing, p.pricing.setupMax)}`, true),
    ...p.pricing.plans.flatMap((pl) => [
      para(`Plan ${pl.name}: ${formatMoney(p.pricing, pl.monthlyPrice)}/mes${pl.name === p.recommendedPlan ? " (recomendado)" : ""}`, true),
      ...bl(pl.features),
    ]),
    para(p.roiEstimate),
    h("Próximos pasos"), ...bl(p.nextSteps)
  );
  const buf = await Packer.toBuffer(new Document({ sections: [{ children }] }));
  return new Uint8Array(buf);
}

export function downloadBytes(bytes: Uint8Array, filename: string, mime: string) {
  const blob = new Blob([bytes as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safeFilename(s: string) {
  return normalizeName(s).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60) || "propuesta";
}
function normalizeName(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
