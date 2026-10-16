"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AppSettings, BusinessLead, ProposalData, ProposalPricing } from "@/types/lead";
import { buildCitySnapshot, listCities } from "@/lib/proposal/snapshot";
import { topProspects } from "@/lib/proposal/hotel";
import { DEFAULT_PROPOSAL_PRICING, DEFAULT_CASE_STUDY, formatMoney } from "@/lib/proposal/template";
import { proposalToPdf, proposalToDocx, downloadBytes, safeFilename } from "@/lib/proposal/export";
import { DEFAULT_BRAND, ProposalBrand } from "@/lib/proposal/brand";
import { FileText, FileDown, Copy, CheckCircle2, Ban, Loader2, MapPin, Sparkles, ShieldCheck } from "lucide-react";

interface Props {
  leads: BusinessLead[];
  settings: AppSettings;
  onSaveLead: (lead: BusinessLead) => Promise<void>;
  onSaveSettings: (partial: Partial<AppSettings>) => Promise<void>;
  onOpenLead: (lead: BusinessLead) => void;
}

export function ProposalsView({ leads, settings, onSaveLead, onSaveSettings, onOpenLead }: Props) {
  const cities = useMemo(() => listCities(leads), [leads]);
  const [city, setCity] = useState("");
  const [topN, setTopN] = useState(12);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [checks, setChecks] = useState({ data: false, tone: false, consent: false });
  const pricing: ProposalPricing = settings.proposalPricing || DEFAULT_PROPOSAL_PRICING;
  const [pricingDraft, setPricingDraft] = useState<ProposalPricing>(pricing);

  useEffect(() => {
    if (!city && cities.length) setCity(cities[0].city);
  }, [cities, city]);

  const snapshot = useMemo(() => (city ? buildCitySnapshot(leads, city) : undefined), [leads, city]);
  const ranked = useMemo(() => (city ? topProspects(leads, city, snapshot, topN) : []), [leads, city, snapshot, topN]);
  const selected = leads.find((l) => l.id === selectedId) || null;
  const proposal = selected?.proposal;

  useEffect(() => {
    setChecks({ data: false, tone: false, consent: false });
    setCopied(false);
  }, [selectedId]);

  const generate = async (lead: BusinessLead) => {
    setLoadingId(lead.id);
    setMessage(null);
    try {
      const res = await fetch("/api/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead,
          snapshot,
          sellerProfile: { ...settings.sellerProfile, brandName: (settings.proposalBrand || DEFAULT_BRAND).name },
          pricing,
          caseStudy: settings.proposalCaseStudy || DEFAULT_CASE_STUDY,
          geminiApiKey: settings.geminiApiKey,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error generando la propuesta");
      const data: ProposalData = json.data;
      await onSaveLead({ ...lead, proposal: data, status: "PROPUESTA_LISTA" });
      setSelectedId(lead.id);
      setMessage(json.warning || "Propuesta generada con IA. Revísala antes de usarla.");
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setLoadingId(null);
    }
  };

  const toggleDnc = async (lead: BusinessLead) => {
    const reason = !lead.doNotContact ? prompt("Motivo (opcional), p. ej. 'pidió no ser contactado':") || "" : "";
    await onSaveLead({ ...lead, doNotContact: !lead.doNotContact, doNotContactReason: reason || undefined });
  };

  const approve = async () => {
    if (!selected?.proposal) return;
    await onSaveLead({ ...selected, proposal: { ...selected.proposal, approvedAt: new Date().toISOString(), approvedBy: settings.sellerProfile.fullName } });
    setMessage("Propuesta aprobada. El envío sigue siendo manual: copia el texto y envíalo tú mismo, 1 a 1.");
  };

  const brand: ProposalBrand = settings.proposalBrand || DEFAULT_BRAND;
  const [brandDraft, setBrandDraft] = useState<ProposalBrand>(brand);
  const getMeta = async () => {
    if (!selected) return null;
    let logoBytes: Uint8Array | undefined;
    try {
      if (brand.logoUrl) {
        const r = await fetch(brand.logoUrl);
        if (r.ok) logoBytes = new Uint8Array(await r.arrayBuffer());
      }
    } catch {
      /* sin logo */
    }
    return { lead: selected, sellerName: settings.sellerProfile.fullName, brand, logoBytes };
  };
  const panel = "rounded-xl border border-radar-border bg-radar-panel p-4 shadow-xl";
  const btn = "flex items-center gap-1.5 rounded-lg border border-radar-borderLight px-3 py-1.5 text-xs text-slate-200 hover:border-radar-accent disabled:opacity-40";
  const allChecked = checks.data && checks.tone && checks.consent;

  return (
    <div className="space-y-5">
      <div className={`${panel} flex flex-wrap items-center gap-3`}>
        <MapPin className="h-4 w-4 text-radar-accent" />
        <select value={city} onChange={(e) => setCity(e.target.value)} className="rounded-lg border border-radar-borderLight bg-radar-bg px-3 py-1.5 text-xs text-slate-200">
          {cities.length === 0 && <option value="">Guarda leads desde «Buscar» primero</option>}
          {cities.map((c) => (
            <option key={c.city} value={c.city}>{c.city} ({c.count})</option>
          ))}
        </select>
        <label className="text-xs text-radar-textMuted">
          Top
          <select value={topN} onChange={(e) => setTopN(Number(e.target.value))} className="ml-2 rounded border border-radar-borderLight bg-radar-bg px-2 py-1 text-xs text-slate-200">
            {[5, 10, 12, 15].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <span className="text-[11px] text-radar-textMuted">Calidad antes que volumen: trabaja a fondo 1-2 prospectos a la vez.</span>
      </div>

      {snapshot && snapshot.totalBusinesses > 0 && (
        <div className={`${panel} grid grid-cols-2 gap-3 sm:grid-cols-6 text-center`}>
          {[
            ["Negocios", snapshot.totalBusinesses],
            ["Hospedajes", snapshot.hotelCount],
            ["Rating medio", `${snapshot.averageRating}★`],
            ["Reseñas medias", snapshot.averageReviews],
            ["Sin web propia", `${snapshot.withoutWebsitePercent}%`],
            ["Con teléfono", `${snapshot.withPhonePercent}%`],
          ].map(([k, v]) => (
            <div key={String(k)}>
              <div className="text-lg font-bold text-radar-accent font-mono">{v}</div>
              <div className="text-[10px] uppercase text-radar-textMuted">{k}</div>
            </div>
          ))}
          <p className="col-span-full text-[10px] text-radar-textMuted">Foto del mercado calculada solo con los datos de Google Places ya guardados (sin scraping).</p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className={panel}>
          <h3 className="mb-3 text-sm font-semibold text-radar-textLight">Mejores prospectos en {city || "—"}</h3>
          {ranked.length === 0 && <p className="text-xs text-radar-textMuted">Sin prospectos elegibles en esta ciudad.</p>}
          <ul className="space-y-2">
            {ranked.map(({ lead, result }, i) => (
              <li key={lead.id} className={`rounded-lg border p-3 ${selectedId === lead.id ? "border-radar-accent" : "border-radar-borderLight"}`}>
                <div className="flex items-center justify-between gap-2">
                  <button className="text-left" onClick={() => setSelectedId(lead.id)}>
                    <div className="text-xs font-semibold text-slate-100">{i + 1}. {lead.name}</div>
                    <div className="text-[11px] text-radar-textMuted">{lead.googleRating}★ · {lead.userRatingCount} reseñas · {lead.status}{lead.proposal?.approvedAt ? " · aprobada" : ""}</div>
                  </button>
                  <span className="font-mono text-sm font-bold text-radar-accent" title={result.breakdown.map((b) => `${b.label} (+${b.points})`).join("\n")}>{result.score}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button className={btn} disabled={loadingId === lead.id} onClick={() => generate(lead)}>
                    {loadingId === lead.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {lead.proposal ? "Regenerar" : "Generar propuesta"}
                  </button>
                  <button className={btn} onClick={() => onOpenLead(lead)}>Ficha</button>
                  <button className={btn} onClick={() => toggleDnc(lead)}><Ban className="h-3 w-3" />No contactar</button>
                </div>
              </li>
            ))}
          </ul>
          {leads.some((l) => l.doNotContact) && (
            <details className="mt-3 text-[11px] text-radar-textMuted">
              <summary>Lista «No contactar» ({leads.filter((l) => l.doNotContact).length})</summary>
              {leads.filter((l) => l.doNotContact).map((l) => (
                <div key={l.id} className="flex justify-between py-1">
                  <span>{l.name}{l.doNotContactReason ? ` — ${l.doNotContactReason}` : ""}</span>
                  <button className="underline" onClick={() => toggleDnc(l)}>quitar</button>
                </div>
              ))}
            </details>
          )}
        </div>

        <div className={panel}>
          {message && <div className="mb-3 rounded border border-radar-borderLight bg-radar-bg p-2 text-[11px] text-slate-300">{message}</div>}
          {!selected || !proposal ? (
            <p className="text-xs text-radar-textMuted">Selecciona un prospecto y genera su propuesta. Nada se envía automáticamente.</p>
          ) : (
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-radar-accent" />
                <h3 className="text-sm font-semibold text-slate-100">{proposal.title}</h3>
                <span className="ml-auto rounded bg-radar-bg px-2 py-0.5 text-[10px]">{proposal.generatedBy === "gemini" ? "IA" : "Plantilla"}</span>
              </div>
              <p>{proposal.executiveSummary}</p>
              <ul className="list-disc pl-4">{proposal.diagnosis.map((d) => <li key={d}>{d}</li>)}</ul>
              <p className="text-radar-textMuted">Plan recomendado: <b>{proposal.recommendedPlan}</b> · Implementación {formatMoney(proposal.pricing, proposal.pricing.setupMin)}–{formatMoney(proposal.pricing, proposal.pricing.setupMax)}</p>

              <div className="flex flex-wrap gap-2">
                <button className={btn} onClick={async () => { const meta = await getMeta(); if (meta) downloadBytes(await proposalToPdf(proposal, meta), `propuesta-${safeFilename(selected.name)}.pdf`, "application/pdf"); }}><FileDown className="h-3 w-3" />PDF</button>
                <button className={btn} onClick={async () => { const meta = await getMeta(); if (meta) downloadBytes(await proposalToDocx(proposal, meta), `propuesta-${safeFilename(selected.name)}.docx`, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"); }}><FileDown className="h-3 w-3" />DOCX</button>
              </div>

              <div>
                <div className="mb-1 font-semibold text-slate-100">Borrador de WhatsApp (editar y enviar manualmente)</div>
                <textarea
                  className="h-40 w-full rounded border border-radar-borderLight bg-radar-bg p-2 text-xs text-slate-200"
                  value={proposal.whatsappDraft}
                  onChange={(e) => onSaveLead({ ...selected, proposal: { ...proposal, whatsappDraft: e.target.value, approvedAt: undefined } })}
                />
                <button
                  className={btn}
                  disabled={!proposal.approvedAt}
                  title={proposal.approvedAt ? "" : "Aprueba la propuesta primero"}
                  onClick={async () => {
                    await navigator.clipboard.writeText(proposal.whatsappDraft);
                    setCopied(true);
                  }}
                >
                  <Copy className="h-3 w-3" />{copied ? "Copiado" : "Copiar texto"}
                </button>
              </div>

              <div className="rounded border border-radar-borderLight p-3">
                <div className="mb-2 flex items-center gap-1 font-semibold text-slate-100"><ShieldCheck className="h-4 w-4" />Revisión humana obligatoria</div>
                {proposal.approvedAt ? (
                  <p className="flex items-center gap-1 text-emerald-300"><CheckCircle2 className="h-4 w-4" />Aprobada el {new Date(proposal.approvedAt).toLocaleString("es-PE")}</p>
                ) : (
                  <>
                    {([
                      ["data", "Verifiqué los datos (nombre, cifras, problemas) en la ficha y en Google Maps."],
                      ["tone", "Leí el texto completo y el tono es adecuado para este negocio."],
                      ["consent", "Es un contacto empresarial público, no está en «No contactar» y será un mensaje 1 a 1."],
                    ] as const).map(([k, label]) => (
                      <label key={k} className="flex items-start gap-2 py-0.5">
                        <input type="checkbox" checked={checks[k]} onChange={(e) => setChecks({ ...checks, [k]: e.target.checked })} />
                        <span>{label}</span>
                      </label>
                    ))}
                    <button className={`${btn} mt-2`} disabled={!allChecked} onClick={approve}><CheckCircle2 className="h-3 w-3" />Aprobar propuesta</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <details className={panel}>
        <summary className="cursor-pointer text-xs font-semibold text-slate-100">Precios y marca de la propuesta (configurables)</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-5 text-xs">
          <label>Implementación mín.<input type="number" className="mt-1 w-full rounded border border-radar-borderLight bg-radar-bg px-2 py-1" value={pricingDraft.setupMin} onChange={(e) => setPricingDraft({ ...pricingDraft, setupMin: Number(e.target.value) })} /></label>
          <label>Implementación máx.<input type="number" className="mt-1 w-full rounded border border-radar-borderLight bg-radar-bg px-2 py-1" value={pricingDraft.setupMax} onChange={(e) => setPricingDraft({ ...pricingDraft, setupMax: Number(e.target.value) })} /></label>
          {pricingDraft.plans.map((p, idx) => (
            <label key={idx}>Plan {p.name} (/mes)<input type="number" className="mt-1 w-full rounded border border-radar-borderLight bg-radar-bg px-2 py-1" value={p.monthlyPrice} onChange={(e) => {
              const plans = pricingDraft.plans.map((pl, j) => (j === idx ? { ...pl, monthlyPrice: Number(e.target.value) } : pl));
              setPricingDraft({ ...pricingDraft, plans });
            }} /></label>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-6 text-xs">
          <label className="sm:col-span-2">Marca<input className="mt-1 w-full rounded border border-radar-borderLight bg-radar-bg px-2 py-1" value={brandDraft.name} onChange={(e) => setBrandDraft({ ...brandDraft, name: e.target.value })} /></label>
          <label className="sm:col-span-2">Logo (ruta en /public)<input className="mt-1 w-full rounded border border-radar-borderLight bg-radar-bg px-2 py-1" value={brandDraft.logoUrl} onChange={(e) => setBrandDraft({ ...brandDraft, logoUrl: e.target.value })} /></label>
          <label>Azul<input type="color" className="mt-1 h-7 w-full" value={brandDraft.colors.primary} onChange={(e) => setBrandDraft({ ...brandDraft, colors: { ...brandDraft.colors, primary: e.target.value } })} /></label>
          <label>Violeta<input type="color" className="mt-1 h-7 w-full" value={brandDraft.colors.secondary} onChange={(e) => setBrandDraft({ ...brandDraft, colors: { ...brandDraft.colors, secondary: e.target.value } })} /></label>
        </div>
        <button className={`${btn} mt-3`} onClick={() => onSaveSettings({ proposalPricing: pricingDraft, proposalBrand: brandDraft })}>Guardar precios y marca</button>
      </details>
    </div>
  );
}
