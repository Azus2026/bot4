"use client";

import React, { useState } from "react";
import { NicheOpportunityStat, NicheRadarResult } from "@/types/lead";
import {
  NICHE_CATALOG,
  PRESET_PACKS,
  NicheCategoryGroup,
} from "@/lib/niche-catalog";
import {
  Compass,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  Loader2,
  TrendingUp,
  Award,
  Globe2,
  Star,
  Zap,
  Layers,
  Check,
  RotateCcw,
  BookOpen,
  CheckSquare,
} from "lucide-react";

interface NicheRadarViewProps {
  onSelectNicheForSearch: (niche: string, zone: string, countryCode: string) => void;
  googleApiKey?: string;
  defaultZone?: string;
  defaultCountryCode?: string;
}

const DEFAULT_CATEGORIES = [
  "talleres mecánicos",
  "clínicas dentales",
  "fisioterapeutas",
  "peluquerías",
  "centros de estética",
  "restaurantes",
  "gimnasios",
  "reformas e interiores",
  "veterinarios",
  "inmobiliarias",
];

export function NicheRadarView({
  onSelectNicheForSearch,
  googleApiKey,
  defaultZone = "",
  defaultCountryCode = "ES",
}: NicheRadarViewProps) {
  const [zone, setZone] = useState(defaultZone);
  const [countryCode, setCountryCode] = useState(defaultCountryCode);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [newCatInput, setNewCatInput] = useState("");
  const [showCostConfirmation, setShowCostConfirmation] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [selectedGroupTab, setSelectedGroupTab] = useState<string>(NICHE_CATALOG[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [radarResult, setRadarResult] = useState<NicheRadarResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddCategory = () => {
    if (!newCatInput.trim()) return;
    const trimmed = newCatInput.trim().toLowerCase();
    if (!categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
    }
    setNewCatInput("");
  };

  const handleRemoveCategory = (catToRemove: string) => {
    setCategories(categories.filter((c) => c !== catToRemove));
  };

  const handleApplyPreset = (packCategories: string[]) => {
    setCategories(packCategories);
  };

  const handleToggleCategoryFromCatalog = (nicheName: string) => {
    if (categories.includes(nicheName)) {
      setCategories(categories.filter((c) => c !== nicheName));
    } else {
      setCategories([...categories, nicheName]);
    }
  };

  const handleSelectAllGroup = (group: NicheCategoryGroup) => {
    const groupNames = group.niches.map((n) => n.name);
    const combined = Array.from(new Set([...categories, ...groupNames]));
    setCategories(combined);
  };

  const handleExecuteScan = async () => {
    setShowCostConfirmation(false);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/niche-radar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zone,
          countryCode,
          categories,
          apiKey: googleApiKey,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Error al escanear radar de nichos");
      }

      const data: NicheRadarResult = await res.json();
      setRadarResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Error procesando el escaneo de nichos");
    } finally {
      setIsLoading(false);
    }
  };

  const activeGroup =
    NICHE_CATALOG.find((g) => g.id === selectedGroupTab) || NICHE_CATALOG[0];

  return (
    <div className="space-y-6">
      {/* Encabezado y Explicación */}
      <div className="rounded-xl border border-radar-border bg-radar-panel p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-radar-border/80 pb-4 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-radar-textLight flex items-center gap-2">
              <Compass className="h-5 w-5 text-radar-accent" />
              <span>Radar de Nichos & Análisis de Oportunidad de Mercado</span>
            </h2>
            <p className="text-xs text-radar-textMuted mt-1">
              Escanea múltiples sectores en tu ciudad, calcula métricas comparativas y deja que Gemini Flash ordene las categorías con mayor retorno.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCatalogModal(true)}
            className="flex items-center gap-2 rounded-lg border border-radar-blue/40 bg-radar-blue/10 px-3.5 py-1.5 text-xs font-mono font-bold text-radar-blue hover:bg-radar-blue/20 transition-all shadow-sm"
          >
            <BookOpen className="h-4 w-4" />
            <span>Catálogo Completo (+40 Nichos)</span>
          </button>
        </div>

        {/* Formulario de Configuración de Escaneo */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
          <div className="sm:col-span-8">
            <label className="text-xs font-mono text-radar-textMuted block mb-1">
              Zona a Escanear (Ciudad, Barrio o Región)
            </label>
            <input
              type="text"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="Ej. Lima, Miraflores, Sevilla, Miami, Guadalajara..."
              className="w-full rounded-lg border border-radar-borderLight bg-radar-bg px-3.5 py-2.5 text-sm text-radar-textLight placeholder:text-slate-600 focus:border-radar-accent focus:outline-none"
            />
          </div>

          <div className="sm:col-span-4 flex items-end">
            <button
              type="button"
              onClick={() => setShowCostConfirmation(true)}
              disabled={isLoading || !zone.trim() || categories.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-radar-accent px-4 py-2.5 text-sm font-bold text-black shadow-lg shadow-radar-accent/20 hover:bg-radar-accentHover transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Escaneando nichos...</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  <span>Escanear Mercado ({categories.length} llamadas)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Packs Comerciales Predefinidos (1-Click) */}
        <div className="mt-4 border-t border-radar-border/60 pt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono text-radar-textMuted flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-radar-accent" />
              <span>Packs Temáticos Predefinidos:</span>
            </label>
            <button
              type="button"
              onClick={() => setCategories(DEFAULT_CATEGORIES)}
              className="flex items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-slate-300"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Restablecer 10 iniciales</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {PRESET_PACKS.map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => handleApplyPreset(pack.categories)}
                className="group flex flex-col justify-between rounded-lg border border-radar-borderLight bg-radar-bg/80 p-2.5 text-left hover:border-radar-accent/60 transition-all hover:bg-radar-panel"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-radar-blue bg-radar-blue/15 px-1.5 py-0.2 rounded">
                      {pack.badge}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {pack.categories.length} nichos
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-white group-hover:text-radar-accent transition-colors">
                    {pack.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                    {pack.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Lista Editable de Categorías Actuales */}
        <div className="mt-4 border-t border-radar-border/60 pt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono text-radar-textMuted">
              Categorías en cola para el Radar actual ({categories.length}):
            </label>
            {categories.length > 0 && (
              <button
                type="button"
                onClick={() => setCategories([])}
                className="text-[11px] font-mono text-rose-400 hover:underline"
              >
                Limpiar lista
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mb-3 max-h-36 overflow-y-auto pr-1">
            {categories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 rounded-lg border border-radar-borderLight bg-radar-bg px-2.5 py-1 text-xs text-slate-200"
              >
                <span className="capitalize">{cat}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(cat)}
                  className="text-slate-500 hover:text-radar-accent"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Agregar nueva categoría manual */}
          <div className="flex items-center gap-2 max-w-md">
            <input
              type="text"
              value={newCatInput}
              onChange={(e) => setNewCatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              placeholder="Escribe otro nicho manual (ej. podólogos, quiroprácticos...)"
              className="flex-1 rounded-lg border border-radar-borderLight bg-radar-bg px-3 py-1.5 text-xs text-radar-textLight placeholder:text-slate-600 focus:outline-none focus:border-radar-blue"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="rounded-lg border border-radar-borderLight bg-radar-bg px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:border-radar-blue"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-lg border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300">
            {errorMessage}
          </div>
        )}
      </div>

      {/* MODAL CATÁLOGO COMPLETO DE SECTORES (+40 NICHOS) */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-radar-border bg-radar-panel p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-radar-border/80 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-radar-accent" />
                  <span>Catálogo de Sectores & Oportunidades Digitales</span>
                </h3>
                <p className="text-xs text-radar-textMuted">
                  Haz clic en cualquier categoría para agregarla o quitarla de tu lista de radar activa.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-radar-bg"
              >
                ✕
              </button>
            </div>

            {/* Pestañas de Grupos de Industria */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-radar-border/60 text-xs font-mono">
              {NICHE_CATALOG.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupTab(group.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    selectedGroupTab === group.id
                      ? "bg-radar-accent text-black font-bold"
                      : "bg-radar-bg text-slate-300 hover:text-white border border-radar-borderLight"
                  }`}
                >
                  <span>{group.icon}</span>
                  <span>{group.name.split("(")[0]}</span>
                </button>
              ))}
            </div>

            {/* Contenido del Grupo Activo */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
                <span>{activeGroup.niches.length} nichos disponibles en este sector</span>
                <button
                  type="button"
                  onClick={() => handleSelectAllGroup(activeGroup)}
                  className="text-radar-blue hover:underline"
                >
                  + Seleccionar todos del grupo
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeGroup.niches.map((niche) => {
                  const isSelected = categories.includes(niche.name);
                  return (
                    <div
                      key={niche.id}
                      onClick={() => handleToggleCategoryFromCatalog(niche.name)}
                      className={`cursor-pointer rounded-xl border p-3 transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? "border-radar-accent bg-radar-accent/10"
                          : "border-radar-borderLight bg-radar-bg hover:border-slate-500"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xs text-white capitalize">
                            {niche.name}
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                              niche.ticketLevel === "ALTO"
                                ? "bg-amber-500/20 text-amber-300"
                                : niche.ticketLevel === "MEDIO"
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            Ticket {niche.ticketLevel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          {niche.description}
                        </p>
                      </div>

                      <div
                        className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-radar-accent border-radar-accent text-black font-bold"
                            : "border-slate-600 bg-radar-panel"
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="border-t border-radar-border/80 pt-3 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">
                Seleccionadas: <strong className="text-radar-accent">{categories.length}</strong> categorías
              </span>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="rounded-lg bg-radar-accent px-4 py-2 font-bold text-black hover:bg-radar-accentHover"
              >
                Aplicar al Radar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerta Preventiva de Costos de Cuota */}
      {showCostConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-radar-accent/60 bg-radar-panel p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-radar-accent">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="font-bold text-base text-white">Confirmación de Consumo de Cuota</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Esta consulta ejecutará exactamente{" "}
              <strong className="text-radar-accent font-bold">{categories.length} llamadas</strong> a
              Google Places API (1 por cada categoría seleccionada en la zona de{" "}
              <strong className="text-white font-bold">{zone}</strong>).
            </p>
            <p className="text-xs text-slate-400">¿Deseas continuar con el escaneo de mercado?</p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCostConfirmation(false)}
                className="rounded-lg border border-radar-borderLight px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteScan}
                className="rounded-lg bg-radar-accent px-4 py-2 text-xs font-bold text-black hover:bg-radar-accentHover shadow-md"
              >
                Sí, Ejecutar Escaneo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resultados del Escaneo */}
      {radarResult && (
        <div className="space-y-6">
          {/* Top 3 Veredicto de Gemini Flash */}
          {radarResult.top3Recommendation && radarResult.top3Recommendation.length > 0 && (
            <div className="rounded-xl border border-radar-blue/40 bg-gradient-to-br from-radar-panel to-radar-blue/10 p-5 space-y-4">
              <div className="flex items-center gap-2 text-radar-blue">
                <Award className="h-5 w-5" />
                <h3 className="font-bold text-base text-white">
                  Top 3 Nichos Recomendados por Gemini Flash
                </h3>
              </div>

              {radarResult.geminiExecutiveSummary && (
                <p className="text-xs text-slate-300 leading-relaxed italic border-l-2 border-radar-blue pl-3">
                  {radarResult.geminiExecutiveSummary}
                </p>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {radarResult.top3Recommendation.map((rec, rIdx) => (
                  <div
                    key={rIdx}
                    className="rounded-xl border border-radar-borderLight bg-radar-bg/80 p-4 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-radar-accent">
                          #{rIdx + 1} OPORTUNIDAD
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white capitalize mt-1">{rec.category}</h4>
                      <p className="text-xs text-slate-300 mt-1">{rec.why}</p>
                    </div>

                    <div className="pt-3 border-t border-radar-border/60">
                      <div className="flex items-center gap-1.5 text-xs text-radar-blue font-mono mb-2">
                        <Zap className="h-3.5 w-3.5" />
                        <span>Vender: {rec.serviceToSell}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectNicheForSearch(rec.category, radarResult.zone, radarResult.country)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-radar-accent px-3 py-1.5 text-xs font-bold text-black hover:bg-radar-accentHover transition-colors"
                      >
                        <span>Ver Negocios</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matriz Comparativa Completa */}
          <div className="overflow-hidden rounded-xl border border-radar-border bg-radar-panel shadow-2xl">
            <div className="border-b border-radar-border bg-radar-bg/90 px-4 py-3 font-mono text-xs text-slate-300 flex items-center justify-between">
              <span>Matriz Comparativa de Mercado ({radarResult.stats.length} sectores)</span>
              <span className="text-[11px] text-slate-500">Ordenado por Puntuación de Oportunidad</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-radar-border bg-radar-bg/60 font-mono text-[11px] text-radar-textMuted uppercase">
                  <tr>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3 text-center">Negocios Detectados</th>
                    <th className="px-4 py-3 text-center">% Sin Web Propia</th>
                    <th className="px-4 py-3 text-center">Valoración Media</th>
                    <th className="px-4 py-3 text-center">Media Reseñas</th>
                    <th className="px-4 py-3 text-center">Oportunidad</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-radar-border/60">
                  {radarResult.stats.map((stat, sIdx) => (
                    <tr key={sIdx} className="hover:bg-radar-panelHover/60 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-bold text-radar-textLight text-sm capitalize">
                          {stat.category}
                        </span>
                        <span className="block text-[10px] font-mono text-slate-500">
                          Sugerido: {stat.recommendedService}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-200">
                        {stat.totalFound}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-mono font-bold ${
                            stat.withoutWebsitePercent >= 50
                              ? "text-radar-accent"
                              : stat.withoutWebsitePercent >= 25
                              ? "text-amber-300"
                              : "text-slate-400"
                          }`}
                        >
                          {stat.withoutWebsitePercent}%
                        </span>
                        {stat.socialOnlyCount > 0 && (
                          <span className="block text-[10px] text-slate-500">
                            (+{stat.socialOnlyCount} solo red)
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center font-mono text-slate-300">
                        <div className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{stat.averageRating > 0 ? stat.averageRating.toFixed(1) : "N/D"}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center font-mono text-slate-300">
                        {stat.averageReviews}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs ${
                            stat.opportunityRating >= 75
                              ? "bg-radar-blue/20 text-radar-blue border border-radar-blue/40"
                              : stat.opportunityRating >= 50
                              ? "bg-slate-800 text-white border border-slate-600"
                              : "bg-radar-accent/20 text-radar-accent border border-radar-accent/40"
                          }`}
                        >
                          {stat.opportunityRating}/100
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectNicheForSearch(stat.category, radarResult.zone, radarResult.country)}
                          className="inline-flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 px-3 py-1 text-xs text-radar-textLight transition-colors font-mono"
                        >
                          <span>Ver negocios</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
