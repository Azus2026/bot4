"use client";

import React from "react";
import { BusinessLead } from "@/types/lead";
import { ScoreBadge } from "@/components/common/ScoreBadge";
import {
  ExternalLink,
  Phone,
  MapPin,
  Star,
  Sparkles,
  BookmarkPlus,
  Check,
  Globe2,
  Share2,
} from "lucide-react";

interface ResultsCardsProps {
  leads: BusinessLead[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onOpenLead: (lead: BusinessLead) => void;
  onSaveLead: (lead: BusinessLead) => void;
  savedLeadIds: Set<string>;
}

export function ResultsCards({
  leads,
  selectedIds,
  onToggleSelect,
  onOpenLead,
  onSaveLead,
  savedLeadIds,
}: ResultsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {leads.map((lead) => {
        const isSelected = selectedIds.includes(lead.id);
        const isSaved = savedLeadIds.has(lead.id);
        const isAnalyzed = !!lead.webAudit;

        return (
          <div
            key={lead.id}
            className={`group relative flex flex-col justify-between rounded-xl border p-4 transition-all hover:border-radar-accent/60 hover:shadow-xl ${
              isSelected
                ? "border-radar-accent bg-radar-panel"
                : "border-radar-border bg-radar-panel/90"
            }`}
          >
            {/* Header de la tarjeta */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(lead.id)}
                    className="h-4 w-4 rounded border-radar-borderLight bg-radar-bg text-radar-accent focus:ring-0"
                  />
                  <span className="rounded bg-radar-bg px-2 py-0.5 text-[10px] font-mono text-radar-textMuted border border-radar-border">
                    {lead.category}
                  </span>
                </div>

                <ScoreBadge
                  score={lead.definitiveScore ?? lead.preliminaryScore}
                  breakdown={lead.scoreBreakdown}
                  size="sm"
                />
              </div>

              {/* Título y Badges */}
              <h3
                onClick={() => onOpenLead(lead)}
                className="font-bold text-radar-textLight text-base leading-snug cursor-pointer group-hover:text-radar-blue transition-colors"
              >
                {lead.name}
              </h3>

              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {lead.isSpanishTarget && (
                  <span className="rounded-md bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                    Hispano
                  </span>
                )}
                {lead.businessStatus !== "OPERATIONAL" && (
                  <span className="rounded bg-rose-900/40 border border-rose-500/40 px-2 py-0.5 text-[10px] text-rose-300">
                    Cerrado
                  </span>
                )}
                <div className="flex items-center gap-1 font-mono text-xs text-slate-300">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>{lead.googleRating > 0 ? lead.googleRating.toFixed(1) : "N/D"}</span>
                  <span className="text-slate-500">({lead.userRatingCount})</span>
                </div>
              </div>

              {/* Datos de Contacto y Web */}
              <div className="mt-3.5 space-y-1.5 border-t border-radar-border/60 pt-3 text-xs">
                {/* Dirección */}
                <div className="flex items-start gap-1.5 text-slate-400">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500 mt-0.5" />
                  <span className="truncate">{lead.formattedAddress}</span>
                </div>

                {/* Teléfono */}
                {lead.phone ? (
                  <div className="flex items-center gap-1.5 font-mono text-radar-blue">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <a href={`tel:${lead.phone}`} className="hover:underline">
                      {lead.phone}
                    </a>
                  </div>
                ) : (
                  <div className="font-mono text-[11px] text-slate-600">Sin teléfono disponible</div>
                )}

                {/* Web */}
                <div className="pt-1">
                  {lead.websiteType === "CUSTOM_WEBSITE" && lead.websiteUri ? (
                    <a
                      href={lead.websiteUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-radar-blue hover:underline font-mono text-xs truncate max-w-full"
                    >
                      <Globe2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{lead.websiteUri.replace(/^https?:\/\//i, "")}</span>
                      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    </a>
                  ) : lead.websiteType === "SOCIAL_MEDIA" ? (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-radar-accent font-semibold">
                      <Share2 className="h-3 w-3" />
                      <span>Solo {lead.socialNetworkDetected || "Red Social"}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded bg-slate-800/80 border border-slate-700 px-2 py-0.5 text-[10px] font-mono text-slate-400 font-bold">
                      Sin web propia
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer con Acciones */}
            <div className="mt-4 flex items-center justify-between border-t border-radar-border/60 pt-3">
              <button
                type="button"
                onClick={() => onSaveLead(lead)}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-mono transition-colors ${
                  isSaved
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "border border-radar-borderLight bg-radar-bg text-slate-400 hover:text-white"
                }`}
              >
                {isSaved ? <Check className="h-3.5 w-3.5" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
                <span>{isSaved ? "Guardado" : "Guardar"}</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenLead(lead)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                  isAnalyzed
                    ? "bg-radar-blue/20 border border-radar-blue text-radar-blue hover:bg-radar-blue/30"
                    : "bg-radar-accent text-black hover:bg-radar-accentHover shadow-md shadow-radar-accent/20"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isAnalyzed ? "Ver Ficha" : "Analizar Ficha"}</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
