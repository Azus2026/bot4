"use client";

import React, { useState } from "react";
import {
  BusinessLead,
  OutreachTone,
  SellerProfile,
  WebAuditData,
} from "@/types/lead";
import { ScoreBadge } from "@/components/common/ScoreBadge";
import {
  X,
  Phone,
  Globe2,
  MapPin,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Printer,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Loader2,
  MessageCircle,
  Mail,
  Zap,
} from "lucide-react";

interface LeadDetailModalProps {
  lead: BusinessLead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateLead: (updatedLead: BusinessLead) => void;
  sellerProfile: SellerProfile;
  googleApiKey?: string;
  geminiApiKey?: string;
}

export function LeadDetailModal({
  lead,
  isOpen,
  onClose,
  onUpdateLead,
  sellerProfile,
  googleApiKey,
  geminiApiKey,
}: LeadDetailModalProps) {
  const [isAuditing, setIsAuditing] = useState(false);
  const [selectedTone, setSelectedTone] = useState<OutreachTone>("CONSULTIVE");
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [crmNotes, setCrmNotes] = useState(lead?.notes || "");
  const [crmStatus, setCrmStatus] = useState(lead?.status || "NUEVO");
  const [nextActionDate, setNextActionDate] = useState(lead?.nextFollowUpDate || "");
  const [auditError, setAuditError] = useState<string | null>(null);

  if (!isOpen || !lead) return null;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleRunAudit = async () => {
    setIsAuditing(true);
    setAuditError(null);

    try {
      let pageSpeedScores = undefined;
      let screenshotBase64 = undefined;

      // 1. Si tiene página web propia, consultar PageSpeed Insights
      if (lead.websiteType === "CUSTOM_WEBSITE" && lead.websiteUri) {
        try {
          const psRes = await fetch("/api/pagespeed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: lead.websiteUri,
              apiKey: googleApiKey,
            }),
          });
          if (psRes.ok) {
            const psData = await psRes.json();
            pageSpeedScores = psData.scores;
            screenshotBase64 = psData.screenshotBase64;
          }
        } catch (psErr) {
          console.warn("Fallo auditoría PageSpeed:", psErr);
        }
      }

      // 2. Consultar Gemini Flash con o sin web
      const geminiRes = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead,
          sellerProfile,
          pageSpeedScores,
          tone: selectedTone,
          apiKey: googleApiKey,
          geminiApiKey: geminiApiKey || googleApiKey,
        }),
      });

      if (!geminiRes.ok) {
        const errJson = await geminiRes.json();
        throw new Error(errJson.error || "Error al generar auditoría con Gemini");
      }

      const geminiData = await geminiRes.json();
      const auditResult = geminiData.data;

      // Importar cálculo definitivo
      const { calculateDefinitiveScore } = await import("@/lib/scoring");
      const webAuditPayload: WebAuditData = {
        pageSpeedScores,
        screenshotBase64,
        analysis: {
          summary: auditResult.summary,
          checklist: auditResult.checklist,
          extractedEmails: auditResult.extractedEmails || [],
          extractedSocials: auditResult.extractedSocials || [],
          painPoints: auditResult.painPoints || [],
          suggestedService: auditResult.suggestedService,
          serviceJustification: auditResult.serviceJustification,
        },
        outreachDrafts: auditResult.outreachDrafts,
        auditedAt: new Date().toISOString(),
      };

      const { score: defScore, breakdown: defBreakdown } = calculateDefinitiveScore(
        lead.preliminaryScore,
        lead.scoreBreakdown,
        webAuditPayload
      );

      const updatedLead: BusinessLead = {
        ...lead,
        definitiveScore: defScore,
        scoreBreakdown: defBreakdown,
        webAudit: webAuditPayload,
        status: lead.status === "NUEVO" ? "ANALIZADO" : lead.status,
      };

      onUpdateLead(updatedLead);
    } catch (err: any) {
      setAuditError(err.message || "Ocurrió un error inesperado al analizar el negocio.");
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSaveCrmChanges = () => {
    const updatedLead: BusinessLead = {
      ...lead,
      notes: crmNotes,
      status: crmStatus,
      nextFollowUpDate: nextActionDate,
      updatedAt: new Date().toISOString(),
    };
    onUpdateLead(updatedLead);
  };

  const handlePrint = () => {
    window.print();
  };

  const audit = lead.webAudit;
  const ps = audit?.pageSpeedScores;

  const getPsBadgeClass = (val: number) => {
    if (val >= 90) return "text-radar-blue bg-radar-blue/15 border-radar-blue/40";
    if (val >= 50) return "text-radar-textLight bg-slate-800 border-slate-600";
    return "text-radar-accent bg-radar-accent/15 border-radar-accent/40 font-bold";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-radar-border bg-radar-panel text-radar-textLight shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header Modal */}
        <div className="flex items-start justify-between border-b border-radar-border/80 bg-radar-bg/80 px-6 py-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="rounded bg-radar-panel border border-radar-border px-2 py-0.5 text-xs font-mono text-radar-textMuted">
                {lead.category}
              </span>
              {lead.isSpanishTarget && (
                <span className="rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-xs font-mono font-bold text-amber-300">
                  Comunidad Hispana
                </span>
              )}
              <ScoreBadge
                score={lead.definitiveScore ?? lead.preliminaryScore}
                breakdown={lead.scoreBreakdown}
                size="md"
              />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white">{lead.name}</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              <span>{lead.formattedAddress}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-radar-borderLight bg-radar-panel px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white hover:border-radar-accent transition-colors"
              title="Exportar versión imprimible o PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exportar Ficha</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-radar-border hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-sm">
          {/* Fila de Contacto Rápido */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Teléfono */}
            <div className="rounded-xl border border-radar-border bg-radar-bg/60 p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Teléfono Directo</span>
                <span className="font-mono font-bold text-radar-blue text-sm">
                  {lead.phone || "No registrado"}
                </span>
              </div>
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="rounded-lg bg-radar-blue/20 p-2 text-radar-blue hover:bg-radar-blue/30 transition-colors"
                  title="Llamar"
                >
                  <Phone className="h-4 w-4" />
                </a>
              )}
            </div>

            {/* Página Web */}
            <div className="rounded-xl border border-radar-border bg-radar-bg/60 p-3 flex items-center justify-between">
              <div className="truncate pr-2">
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Presencia Web</span>
                <span className="font-mono text-xs text-slate-300 truncate block">
                  {lead.websiteUri ? lead.websiteUri.replace(/^https?:\/\//i, "") : "Sin web"}
                </span>
              </div>
              {lead.websiteUri ? (
                <a
                  href={lead.websiteUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-slate-800 p-2 text-slate-300 hover:text-white transition-colors"
                  title="Abrir web"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                  Sin URL
                </span>
              )}
            </div>

            {/* Google Maps */}
            <div className="rounded-xl border border-radar-border bg-radar-bg/60 p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Google Maps</span>
                <span className="font-mono text-xs text-amber-400 font-bold">
                  {lead.googleRating > 0 ? `${lead.googleRating.toFixed(1)}★` : "Sin rating"} ({lead.userRatingCount} reseñas)
                </span>
              </div>
              <a
                href={lead.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-amber-500/20 p-2 text-amber-400 hover:bg-amber-500/30 transition-colors"
                title="Ver en Google Maps"
              >
                <MapPin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Sección Laboratorio Web & Auditoría de IA */}
          <div className="rounded-xl border border-radar-borderLight bg-radar-bg/70 p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-radar-border/70 pb-3">
              <div>
                <h3 className="font-bold text-radar-textLight text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-radar-accent" />
                  <span>Laboratorio Web & Diagnóstico Gemini Flash</span>
                </h3>
                <p className="text-xs text-radar-textMuted">
                  Auditoría técnica en vivo: velocidad móvil, checklist de captación y dolores de negocio
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunAudit}
                disabled={isAuditing}
                className="flex items-center gap-2 rounded-lg bg-radar-accent px-4 py-2 text-xs font-bold text-black shadow-lg shadow-radar-accent/20 hover:bg-radar-accentHover transition-all disabled:opacity-50"
              >
                {isAuditing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Auditoría en proceso (10-25s)...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>{audit ? "Re-analizar Web con IA" : "Iniciar Auditoría con IA"}</span>
                  </>
                )}
              </button>
            </div>

            {auditError && (
              <div className="rounded-lg border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{auditError}</span>
              </div>
            )}

            {/* Si ya hay auditoría disponible */}
            {audit ? (
              <div className="space-y-5">
                {/* Métricas PageSpeed (si aplica) */}
                {ps ? (
                  <div>
                    <h4 className="text-xs font-mono uppercase text-slate-400 mb-2">
                      Rendimiento PageSpeed Insights v5 (Estrategia Móvil)
                    </h4>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className={`rounded-xl border p-3 text-center ${getPsBadgeClass(ps.performance)}`}>
                        <span className="block text-[10px] font-mono uppercase opacity-80">Rendimiento</span>
                        <span className="font-mono text-2xl font-black">{ps.performance}</span>
                        <span className="text-[10px] block opacity-70">/100</span>
                      </div>
                      <div className={`rounded-xl border p-3 text-center ${getPsBadgeClass(ps.seo)}`}>
                        <span className="block text-[10px] font-mono uppercase opacity-80">SEO Local</span>
                        <span className="font-mono text-2xl font-black">{ps.seo}</span>
                        <span className="text-[10px] block opacity-70">/100</span>
                      </div>
                      <div className={`rounded-xl border p-3 text-center ${getPsBadgeClass(ps.accessibility)}`}>
                        <span className="block text-[10px] font-mono uppercase opacity-80">Accesibilidad</span>
                        <span className="font-mono text-2xl font-black">{ps.accessibility}</span>
                        <span className="text-[10px] block opacity-70">/100</span>
                      </div>
                      <div className={`rounded-xl border p-3 text-center ${getPsBadgeClass(ps.bestPractices)}`}>
                        <span className="block text-[10px] font-mono uppercase opacity-80">Buenas Prácticas</span>
                        <span className="font-mono text-2xl font-black">{ps.bestPractices}</span>
                        <span className="text-[10px] block opacity-70">/100</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-radar-border bg-radar-panel p-3 text-xs text-slate-400 flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-radar-accent" />
                    <span>
                      Sin web propia registrada: se omite PageSpeed y se diagnostica oportunidad directa de landing page y asistente WhatsApp.
                    </span>
                  </div>
                )}

                {/* Screenshot y Resumen */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                  {audit.screenshotBase64 && (
                    <div className="md:col-span-4 rounded-xl border border-radar-border bg-black/60 p-2 overflow-hidden flex flex-col items-center">
                      <span className="text-[10px] font-mono text-slate-500 mb-1">Captura Móvil Real</span>
                      <img
                        src={audit.screenshotBase64}
                        alt="Screenshot de la web"
                        className="rounded-lg max-h-48 object-cover border border-slate-800"
                      />
                    </div>
                  )}

                  <div className={audit.screenshotBase64 ? "md:col-span-8 space-y-3" : "md:col-span-12 space-y-3"}>
                    {/* Resumen del modelo */}
                    <div className="rounded-lg border border-radar-border bg-radar-panel p-3.5">
                      <span className="text-[10px] font-mono uppercase text-radar-accent block mb-1">
                        ¿A qué se dedica el negocio? (Resumen IA)
                      </span>
                      <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                        {audit.analysis.summary}
                      </p>
                    </div>

                    {/* Servicio recomendado */}
                    <div className="rounded-lg border border-radar-blue/40 bg-radar-blue/10 p-3.5">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="h-4 w-4 text-radar-blue" />
                        <span className="text-xs font-mono font-bold text-radar-blue uppercase">
                          Servicio Recomendado a Vender: {audit.analysis.suggestedService}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        {audit.analysis.serviceJustification}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Checklist Técnico */}
                <div>
                  <h4 className="text-xs font-mono uppercase text-slate-400 mb-2">Checklist Técnico</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-2 rounded-lg border border-radar-border bg-radar-panel p-2">
                      {audit.analysis.checklist.hasWhatsApp ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-radar-accent" />
                      )}
                      <span>Botón WhatsApp</span>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg border border-radar-border bg-radar-panel p-2">
                      {audit.analysis.checklist.hasBooking ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-radar-accent" />
                      )}
                      <span>Citas / Reservas Online</span>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg border border-radar-border bg-radar-panel p-2">
                      {audit.analysis.checklist.hasContactForm ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-radar-accent" />
                      )}
                      <span>Formulario de Contacto</span>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg border border-radar-border bg-radar-panel p-2">
                      {audit.analysis.checklist.hasHttps ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-radar-accent" />
                      )}
                      <span>Certificado HTTPS/SSL</span>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg border border-radar-border bg-radar-panel p-2">
                      {audit.analysis.checklist.isMobileFriendly ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-radar-accent" />
                      )}
                      <span>Adaptada a Celulares</span>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg border border-radar-border bg-radar-panel p-2">
                      {audit.analysis.checklist.isOutdated ? (
                        <XCircle className="h-4 w-4 text-radar-accent" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      )}
                      <span>
                        {audit.analysis.checklist.copyrightYear
                          ? `Copyright: ${audit.analysis.checklist.copyrightYear}`
                          : "Frescura Web"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dolores de Negocio (3 a 5 puntos) */}
                <div>
                  <h4 className="text-xs font-mono uppercase text-slate-400 mb-2">
                    Puntos de Dolor Detectados ({audit.analysis.painPoints.length})
                  </h4>
                  <div className="space-y-2">
                    {audit.analysis.painPoints.map((pain, pIdx) => (
                      <div
                        key={pIdx}
                        className="rounded-lg border border-radar-border bg-radar-panel p-3 text-xs space-y-1"
                      >
                        <div className="font-bold text-radar-textLight flex items-center gap-2">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-radar-accent/20 text-radar-accent text-[10px] font-mono">
                            {pIdx + 1}
                          </span>
                          <span>{pain.issue}</span>
                        </div>
                        <p className="text-slate-400 pl-6">{pain.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <p>Aún no se ha realizado la auditoría técnica profunda de este negocio.</p>
                <p className="text-xs text-slate-500">
                  Haz clic en «Iniciar Auditoría con IA» para analizar velocidad móvil, checklist y redactar borradores.
                </p>
              </div>
            )}
          </div>

          {/* Sección Outreach & Mensajería Personalizada */}
          {audit && (
            <div className="rounded-xl border border-radar-borderLight bg-radar-bg/70 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-radar-border/70 pb-3">
                <div>
                  <h3 className="font-bold text-radar-textLight text-base flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-radar-blue" />
                    <span>Consola de Outreach & Primer Contacto</span>
                  </h3>
                  <p className="text-xs text-radar-textMuted">
                    Respaldado con tu trayectoria On-Chain ($3.8M) y el bono de remodelación 3D para fundadores
                  </p>
                </div>

                {/* Selector de Tono */}
                <div className="flex items-center gap-1 rounded-lg border border-radar-border bg-radar-panel p-1 text-xs font-mono">
                  {(["DIRECT", "CONSULTIVE", "DISRUPTIVE"] as const).map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setSelectedTone(tone)}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        selectedTone === tone
                          ? "bg-radar-blue text-black font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {tone === "DIRECT" ? "Directo" : tone === "CONSULTIVE" ? "Consultivo" : "Disruptivo"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aviso Normativo Obligatorio */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Aviso Importante:</strong> Borradores para contactar de forma personal. No envíes mensajes comerciales masivos sin consentimiento.
                </span>
              </div>

              {/* Los 3 Borradores */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* 1. WhatsApp */}
                <div className="flex flex-col justify-between rounded-xl border border-radar-border bg-radar-panel p-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between border-b border-radar-border/60 pb-2 mb-2">
                      <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5 font-mono">
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Mensaje WhatsApp</span>
                      </span>
                      <button
                        onClick={() => handleCopy(audit.outreachDrafts.whatsapp, "wa")}
                        className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 hover:text-white"
                      >
                        {copiedType === "wa" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedType === "wa" ? "Copiado" : "Copiar"}</span>
                      </button>
                    </div>
                    <pre className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed max-h-56 overflow-y-auto">
                      {audit.outreachDrafts.whatsapp}
                    </pre>
                  </div>
                </div>

                {/* 2. Guion Telefónico (30s) */}
                <div className="flex flex-col justify-between rounded-xl border border-radar-border bg-radar-panel p-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between border-b border-radar-border/60 pb-2 mb-2">
                      <span className="font-bold text-radar-blue text-xs flex items-center gap-1.5 font-mono">
                        <Phone className="h-3.5 w-3.5" />
                        <span>Guion Llamada (30s)</span>
                      </span>
                      <button
                        onClick={() => handleCopy(audit.outreachDrafts.callScript, "call")}
                        className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 hover:text-white"
                      >
                        {copiedType === "call" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedType === "call" ? "Copiado" : "Copiar"}</span>
                      </button>
                    </div>
                    <pre className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed max-h-56 overflow-y-auto">
                      {audit.outreachDrafts.callScript}
                    </pre>
                  </div>
                </div>

                {/* 3. Correo en Frío */}
                <div className="flex flex-col justify-between rounded-xl border border-radar-border bg-radar-panel p-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between border-b border-radar-border/60 pb-2 mb-2">
                      <span className="font-bold text-purple-400 text-xs flex items-center gap-1.5 font-mono">
                        <Mail className="h-3.5 w-3.5" />
                        <span>Correo en Frío</span>
                      </span>
                      <button
                        onClick={() =>
                          handleCopy(
                            `Asunto: ${audit.outreachDrafts.email.subject}\n\n${audit.outreachDrafts.email.body}`,
                            "email"
                          )
                        }
                        className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 hover:text-white"
                      >
                        {copiedType === "email" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedType === "email" ? "Copiado" : "Copiar"}</span>
                      </button>
                    </div>
                    <div className="text-xs text-slate-200 space-y-2 max-h-56 overflow-y-auto pr-1">
                      <p className="font-bold text-radar-accent">
                        Asunto: {audit.outreachDrafts.email.subject}
                      </p>
                      <pre className="whitespace-pre-wrap font-sans text-slate-300 leading-relaxed">
                        {audit.outreachDrafts.email.body}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sección CRM: Estado, Notas y Próxima Acción */}
          <div className="rounded-xl border border-radar-border bg-radar-panel p-4 space-y-3">
            <h4 className="text-xs font-mono uppercase text-slate-400 font-bold">
              Gestión de Seguimiento CRM
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-mono text-slate-500 block mb-1">Estado</label>
                <select
                  value={crmStatus}
                  onChange={(e) => setCrmStatus(e.target.value as any)}
                  className="w-full rounded-lg border border-radar-borderLight bg-radar-bg p-2 text-xs text-radar-textLight focus:outline-none focus:border-radar-accent"
                >
                  <option value="NUEVO">Nuevo</option>
                  <option value="ANALIZADO">Analizado</option>
                  <option value="CONTACTADO">Contactado</option>
                  <option value="RESPONDIO">Respondió</option>
                  <option value="REUNION">Reunión Agendada</option>
                  <option value="CLIENTE">Cliente Cerrado</option>
                  <option value="DESCARTADO">Descartado</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-500 block mb-1">Próxima Acción</label>
                <input
                  type="date"
                  value={nextActionDate}
                  onChange={(e) => setNextActionDate(e.target.value)}
                  className="w-full rounded-lg border border-radar-borderLight bg-radar-bg p-2 text-xs text-radar-textLight focus:outline-none focus:border-radar-accent"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleSaveCrmChanges}
                  className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 px-3 py-2 text-xs font-bold text-white transition-colors"
                >
                  Guardar Cambios de CRM
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-500 block mb-1">Notas del Lead</label>
              <textarea
                value={crmNotes}
                onChange={(e) => setCrmNotes(e.target.value)}
                rows={2}
                placeholder="Observaciones de la llamada, objeciones, horarios preferidos de contacto..."
                className="w-full rounded-lg border border-radar-borderLight bg-radar-bg p-2.5 text-xs text-radar-textLight placeholder:text-slate-600 focus:outline-none focus:border-radar-accent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
