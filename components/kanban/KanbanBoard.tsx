"use client";

import React, { useState } from "react";
import { BusinessLead, LeadStatus } from "@/types/lead";
import { ScoreBadge } from "@/components/common/ScoreBadge";
import {
  Download,
  Filter,
  Search,
  Phone,
  Globe2,
  Calendar,
  Trash2,
  Sparkles,
  ArrowRight,
  MapPin,
  Table as TableIcon,
  Columns3,
  UserCheck,
} from "lucide-react";

interface KanbanBoardProps {
  leads: BusinessLead[];
  onUpdateLeadStatus: (id: string, newStatus: LeadStatus) => void;
  onOpenLead: (lead: BusinessLead) => void;
  onDeleteLead: (id: string) => void;
}

const KANBAN_COLUMNS: Array<{ status: LeadStatus; label: string; color: string }> = [
  { status: "NUEVO", label: "Nuevo", color: "border-slate-500 text-slate-300" },
  { status: "ANALIZADO", label: "Analizado", color: "border-radar-blue text-radar-blue" },
  { status: "PROPUESTA_LISTA", label: "Propuesta lista", color: "border-cyan-400 text-cyan-300" },
  { status: "CONTACTADO", label: "Contactado", color: "border-amber-400 text-amber-300" },
  { status: "RESPONDIO", label: "Respondió", color: "border-emerald-400 text-emerald-300" },
  { status: "REUNION", label: "Reunión", color: "border-purple-400 text-purple-300" },
  { status: "CLIENTE", label: "Cliente", color: "border-green-500 text-green-400 font-bold" },
  { status: "DESCARTADO", label: "Descartado", color: "border-rose-500/50 text-rose-400" },
];

export function KanbanBoard({
  leads,
  onUpdateLeadStatus,
  onOpenLead,
  onDeleteLead,
}: KanbanBoardProps) {
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Obtener categorías únicas
  const uniqueCategories = Array.from(new Set(leads.map((l) => l.category)));

  // Filtrar leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.formattedAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.phone && lead.phone.includes(searchTerm));

    const matchesCategory =
      categoryFilter === "all" || lead.category.toLowerCase() === categoryFilter.toLowerCase();

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Exportar CSV
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;

    const headers = [
      "ID",
      "Nombre",
      "Categoría",
      "Teléfono",
      "Página Web",
      "Dirección",
      "Rating",
      "Reseñas",
      "Score Oportunidad",
      "Comunidad Hispana",
      "Estado CRM",
      "Notas",
      "Próxima Acción",
      "Fecha Guardado",
    ];

    const rows = filteredLeads.map((l) => [
      `"${l.id}"`,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.category.replace(/"/g, '""')}"`,
      `"${l.phone || ""}"`,
      `"${l.websiteUri || ""}"`,
      `"${l.formattedAddress.replace(/"/g, '""')}"`,
      l.googleRating,
      l.userRatingCount,
      l.definitiveScore ?? l.preliminaryScore,
      l.isSpanishTarget ? "Sí" : "No",
      `"${l.status}"`,
      `"${(l.notes || "").replace(/"/g, '""')}"`,
      `"${l.nextFollowUpDate || ""}"`,
      `"${l.savedAt || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads_radar_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Barra de Filtros, Búsqueda y Exportar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-radar-border bg-radar-panel p-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Buscador */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, teléfono o zona..."
              className="w-full rounded-lg border border-radar-borderLight bg-radar-bg pl-9 pr-3 py-1.5 text-xs text-radar-textLight placeholder:text-slate-600 focus:outline-none focus:border-radar-accent"
            />
          </div>

          {/* Filtro por Categoría */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-radar-borderLight bg-radar-bg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-radar-accent"
          >
            <option value="all">Todas las categorías ({uniqueCategories.length})</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Filtro por Estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-radar-borderLight bg-radar-bg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-radar-accent"
          >
            <option value="all">Todos los estados</option>
            {KANBAN_COLUMNS.map((col) => (
              <option key={col.status} value={col.status}>
                {col.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de Vista (Kanban vs Tabla) */}
          <div className="flex items-center rounded-lg border border-radar-borderLight bg-radar-bg p-0.5">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded transition-all ${
                viewMode === "kanban"
                  ? "bg-radar-panel text-radar-accent"
                  : "text-radar-textMuted hover:text-white"
              }`}
              title="Tablero Kanban"
            >
              <Columns3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded transition-all ${
                viewMode === "table"
                  ? "bg-radar-panel text-radar-accent"
                  : "text-radar-textMuted hover:text-white"
              }`}
              title="Tabla de Leads"
            >
              <TableIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Botón Exportar CSV */}
          <button
            onClick={handleExportCSV}
            disabled={filteredLeads.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-radar-borderLight bg-radar-bg hover:border-radar-accent px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white transition-colors disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar CSV ({filteredLeads.length})</span>
          </button>
        </div>
      </div>

      {/* VISTA KANBAN */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => {
            const columnLeads = filteredLeads.filter((l) => l.status === col.status);

            return (
              <div
                key={col.status}
                className="flex flex-col rounded-xl border border-radar-border bg-radar-panel/80 min-w-[210px] min-h-[480px] shadow-lg"
              >
                {/* Header Columna */}
                <div className={`border-b border-radar-border px-3 py-2.5 flex items-center justify-between ${col.color}`}>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">
                    {col.label}
                  </span>
                  <span className="rounded-full bg-radar-bg px-2 py-0.5 font-mono text-[10px] text-slate-300 border border-radar-border">
                    {columnLeads.length}
                  </span>
                </div>

                {/* Tarjetas de Leads */}
                <div className="flex-1 p-2 space-y-2.5 overflow-y-auto max-h-[65vh]">
                  {columnLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="group rounded-lg border border-radar-borderLight bg-radar-bg/90 p-3 text-xs shadow hover:border-radar-accent/60 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                          {lead.category}
                        </span>
                        <ScoreBadge
                          score={lead.definitiveScore ?? lead.preliminaryScore}
                          breakdown={lead.scoreBreakdown}
                          size="sm"
                          showHoverBreakdown={false}
                        />
                      </div>

                      <h4
                        onClick={() => onOpenLead(lead)}
                        className="font-bold text-radar-textLight text-xs leading-snug cursor-pointer group-hover:text-radar-blue transition-colors line-clamp-2"
                      >
                        {lead.name}
                      </h4>

                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="flex items-center gap-1 font-mono text-[11px] text-radar-blue hover:underline"
                        >
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{lead.phone}</span>
                        </a>
                      )}

                      {lead.nextFollowUpDate && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                          <Calendar className="h-3 w-3" />
                          <span>Próx: {lead.nextFollowUpDate}</span>
                        </div>
                      )}

                      {/* Selector de cambio de estado rápido */}
                      <div className="pt-2 border-t border-radar-border/60 flex items-center justify-between">
                        <select
                          value={lead.status}
                          onChange={(e) => onUpdateLeadStatus(lead.id, e.target.value as LeadStatus)}
                          className="rounded bg-radar-panel border border-radar-border text-[10px] font-mono text-slate-300 py-0.5 px-1 focus:outline-none"
                        >
                          {KANBAN_COLUMNS.map((c) => (
                            <option key={c.status} value={c.status}>
                              {c.label}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onOpenLead(lead)}
                            className="rounded p-1 text-slate-400 hover:text-radar-blue"
                            title="Ver Ficha / Borradores"
                          >
                            <Sparkles className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => onDeleteLead(lead.id)}
                            className="rounded p-1 text-slate-500 hover:text-rose-400"
                            title="Eliminar de Mis Leads"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {columnLeads.length === 0 && (
                    <div className="py-8 text-center text-[11px] font-mono text-slate-600">
                      Sin prospectos
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA TABLA DE LEADS */
        <div className="overflow-hidden rounded-xl border border-radar-border bg-radar-panel shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-radar-border bg-radar-bg font-mono text-[11px] text-radar-textMuted uppercase">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Próxima Acción</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-radar-border/60">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-radar-panelHover/60 transition-colors">
                    <td className="px-4 py-3">
                      <span
                        onClick={() => onOpenLead(lead)}
                        className="font-bold text-radar-textLight text-sm cursor-pointer hover:text-radar-blue"
                      >
                        {lead.name}
                      </span>
                      <span className="block text-[11px] text-slate-500 truncate max-w-xs">
                        {lead.formattedAddress}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-300">{lead.category}</td>

                    <td className="px-4 py-3 font-mono text-radar-blue">
                      {lead.phone ? (
                        <a href={`tel:${lead.phone}`} className="hover:underline">
                          {lead.phone}
                        </a>
                      ) : (
                        <span className="text-slate-600">Sin teléfono</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <ScoreBadge
                        score={lead.definitiveScore ?? lead.preliminaryScore}
                        breakdown={lead.scoreBreakdown}
                        size="sm"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <select
                        value={lead.status}
                        onChange={(e) => onUpdateLeadStatus(lead.id, e.target.value as LeadStatus)}
                        className="rounded bg-radar-bg border border-radar-borderLight text-xs font-mono text-slate-200 py-1 px-2 focus:outline-none"
                      >
                        {KANBAN_COLUMNS.map((c) => (
                          <option key={c.status} value={c.status}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3 font-mono text-amber-300 text-xs">
                      {lead.nextFollowUpDate || "Sin fecha"}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onOpenLead(lead)}
                          className="rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs text-white"
                        >
                          Ficha
                        </button>
                        <button
                          onClick={() => onDeleteLead(lead.id)}
                          className="rounded p-1 text-slate-500 hover:text-rose-400"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
