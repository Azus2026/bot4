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
  Mail,
} from "lucide-react";

interface ResultsTableProps {
  leads: BusinessLead[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onOpenLead: (lead: BusinessLead) => void;
  onSaveLead: (lead: BusinessLead) => void;
  savedLeadIds: Set<string>;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
}

export function ResultsTable({
  leads,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onOpenLead,
  onSaveLead,
  savedLeadIds,
  sortBy = "default",
  onSortChange,
}: ResultsTableProps) {
  const isAllSelected = leads.length > 0 && selectedIds.length === leads.length;

  const handleToggleReviewsSort = () => {
    if (!onSortChange) return;
    if (sortBy === "reviews_desc") {
      onSortChange("rating_desc");
    } else if (sortBy === "rating_desc") {
      onSortChange("reviews_asc");
    } else if (sortBy === "reviews_asc") {
      onSortChange("default");
    } else {
      onSortChange("reviews_desc");
    }
  };

  const handleToggleScoreSort = () => {
    if (!onSortChange) return;
    if (sortBy === "score_desc") {
      onSortChange("default");
    } else {
      onSortChange("score_desc");
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-radar-border bg-radar-panel shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          {/* Header */}
          <thead className="border-b border-radar-border bg-radar-bg/90 font-mono text-[11px] uppercase tracking-wider text-radar-textMuted select-none">
            <tr>
              <th className="w-10 px-3 py-3 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onSelectAll}
                  className="h-3.5 w-3.5 rounded border-radar-borderLight bg-radar-bg text-radar-accent focus:ring-0"
                />
              </th>
              <th className="px-3 py-3">Negocio & Categoría</th>
              <th className="px-3 py-3">Contacto & Dirección</th>
              <th className="px-3 py-3">Presencia Web</th>
              <th
                className="px-3 py-3 text-center cursor-pointer hover:bg-radar-panelHover/80 transition-colors"
                onClick={handleToggleReviewsSort}
                title="Haz clic para alternar: Mayor a menor reseñas ➔ Mayor valoración ➔ Por defecto"
              >
                <div className="inline-flex items-center gap-1.5 justify-center">
                  <span>Reseñas / Rating</span>
                  <span
                    className={`rounded px-1 py-0.2 text-[9px] font-bold ${
                      sortBy === "reviews_desc"
                        ? "bg-radar-accent text-black"
                        : sortBy === "rating_desc"
                        ? "bg-amber-400 text-black"
                        : sortBy === "reviews_asc"
                        ? "bg-slate-700 text-slate-300"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {sortBy === "reviews_desc"
                      ? "↓ Reseñas"
                      : sortBy === "rating_desc"
                      ? "↓ Rating"
                      : sortBy === "reviews_asc"
                      ? "↑ Reseñas"
                      : "↕ Ordenar"}
                  </span>
                </div>
              </th>
              <th
                className="px-3 py-3 text-center cursor-pointer hover:bg-radar-panelHover/80 transition-colors"
                onClick={handleToggleScoreSort}
                title="Haz clic para ordenar por Score de oportunidad"
              >
                <div className="inline-flex items-center gap-1 justify-center">
                  <span>Score Oportunidad</span>
                  <span
                    className={`rounded px-1 py-0.2 text-[9px] font-bold ${
                      sortBy === "score_desc"
                        ? "bg-radar-blue text-black"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {sortBy === "score_desc" ? "↓ Score" : "↕"}
                  </span>
                </div>
              </th>
              <th className="px-3 py-3 text-right">Acciones</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-radar-border/60">
            {leads.map((lead) => {
              const isSelected = selectedIds.includes(lead.id);
              const isSaved = savedLeadIds.has(lead.id);
              const isAnalyzed = !!lead.webAudit;

              return (
                <tr
                  key={lead.id}
                  className={`transition-colors hover:bg-radar-panelHover/60 ${
                    isSelected ? "bg-radar-accent/5" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <td className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(lead.id)}
                      className="h-3.5 w-3.5 rounded border-radar-borderLight bg-radar-bg text-radar-accent focus:ring-0"
                    />
                  </td>

                  {/* Nombre y Categoría */}
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-radar-textLight text-sm hover:text-radar-blue transition-colors cursor-pointer" onClick={() => onOpenLead(lead)}>
                          {lead.name}
                        </span>

                        {/* Badge de Relevancia Hispana */}
                        {lead.isSpanishTarget && (
                          <span
                            className="inline-flex items-center rounded-md bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 text-[10px] font-mono font-bold text-amber-300"
                            title="Negocio con audiencia o propietarios hispanohablantes identificados"
                          >
                            Hispano
                          </span>
                        )}

                        {/* Status cerrado */}
                        {lead.businessStatus !== "OPERATIONAL" && (
                          <span className="rounded bg-rose-900/40 border border-rose-500/40 px-1.5 py-0.2 text-[10px] text-rose-300">
                            Cerrado
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-radar-textMuted font-mono">
                        {lead.category}
                      </span>
                    </div>
                  </td>

                  {/* Contacto & Dirección */}
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1 max-w-[240px]">
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          className="flex items-center gap-1.5 font-mono text-radar-blue hover:underline"
                          title="Click para llamar directamente"
                        >
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{lead.phone}</span>
                        </a>
                      ) : (
                        <span className="font-mono text-slate-500 text-[11px]">Sin teléfono</span>
                      )}

                      {(lead.email || lead.webAudit?.analysis?.extractedEmails?.[0]) && (
                        <a
                          href={`mailto:${lead.email || lead.webAudit?.analysis?.extractedEmails?.[0]}`}
                          className="flex items-center gap-1.5 font-mono text-emerald-400 hover:underline text-[11px] truncate"
                          title={lead.email || lead.webAudit?.analysis?.extractedEmails?.[0]}
                        >
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{lead.email || lead.webAudit?.analysis?.extractedEmails?.[0]}</span>
                        </a>
                      )}

                      <div className="flex items-start gap-1 text-[11px] text-slate-400 truncate" title={lead.formattedAddress}>
                        <MapPin className="h-3 w-3 shrink-0 text-slate-500 mt-0.5" />
                        <span className="truncate">{lead.formattedAddress}</span>
                      </div>
                    </div>
                  </td>

                  {/* Presencia Web */}
                  <td className="px-3 py-3">
                    {lead.websiteType === "CUSTOM_WEBSITE" && lead.websiteUri ? (
                      <a
                        href={lead.websiteUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-radar-blue hover:underline max-w-[180px] truncate"
                        title={lead.websiteUri}
                      >
                        <Globe2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{lead.websiteUri.replace(/^https?:\/\//i, "")}</span>
                        <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                      </a>
                    ) : lead.websiteType === "SOCIAL_MEDIA" ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-radar-accent font-semibold">
                          <Share2 className="h-3 w-3" />
                          <span>Solo {lead.socialNetworkDetected || "Red Social"}</span>
                        </span>
                        {lead.websiteUri && (
                          <a
                            href={lead.websiteUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-slate-400 hover:text-slate-200 truncate max-w-[160px]"
                          >
                            Ver perfil
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center rounded bg-slate-800/80 border border-slate-700 px-2 py-0.5 text-[10px] font-mono text-slate-400 font-bold">
                        Sin web propia
                      </span>
                    )}
                  </td>

                  {/* Reseñas & Rating */}
                  <td className="px-3 py-3 text-center">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 font-mono font-bold text-slate-200">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>{lead.googleRating > 0 ? lead.googleRating.toFixed(1) : "N/D"}</span>
                      </div>
                      <span className="text-[10px] font-mono text-radar-textMuted">
                        ({lead.userRatingCount} reseñas)
                      </span>
                    </div>
                  </td>

                  {/* Score de Oportunidad */}
                  <td className="px-3 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <ScoreBadge
                        score={lead.definitiveScore ?? lead.preliminaryScore}
                        breakdown={lead.scoreBreakdown}
                        size="sm"
                      />
                      <span className="text-[9px] font-mono uppercase text-slate-500">
                        {lead.definitiveScore ? "Definitivo" : "Preliminar"}
                      </span>
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Botón Guardar */}
                      <button
                        type="button"
                        onClick={() => onSaveLead(lead)}
                        className={`rounded-md p-1.5 transition-colors ${
                          isSaved
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : "border border-radar-borderLight bg-radar-bg text-slate-400 hover:text-white hover:border-slate-500"
                        }`}
                        title={isSaved ? "Guardado en Mis Leads" : "Guardar en Mis Leads"}
                      >
                        {isSaved ? <Check className="h-3.5 w-3.5" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
                      </button>

                      {/* Botón Abrir Ficha */}
                      <button
                        type="button"
                        onClick={() => onOpenLead(lead)}
                        className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                          isAnalyzed
                            ? "bg-radar-blue/20 border border-radar-blue text-radar-blue hover:bg-radar-blue/30"
                            : "bg-radar-accent text-black hover:bg-radar-accentHover"
                        }`}
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>{isAnalyzed ? "Ver Ficha" : "Analizar"}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
