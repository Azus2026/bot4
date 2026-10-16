"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  Globe2,
  Phone,
  Star,
  MessageSquare,
  Building2,
  Table as TableIcon,
  LayoutGrid,
  CheckSquare,
  Sparkles,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import {
  NICHE_CATALOG,
  ALL_NICHE_NAMES,
  NicheCategoryGroup,
} from "@/lib/niche-catalog";

export interface SearchFilters {
  region: "LATAM" | "US" | "EU";
  countryCode: string;
  countryName: string;
  zone: string;
  niche: string;
  filterSpanish: boolean;
  onlyWithoutWeb: boolean;
  onlyWithPhone: boolean;
  minRating: number;
  minReviews: number;
  hideClosed: boolean;
  viewMode: "table" | "cards";
}

interface SearchConsoleProps {
  filters: SearchFilters;
  onFiltersChange: (newFilters: SearchFilters) => void;
  onSearch: () => void;
  isLoading: boolean;
  onSaveBatch: () => void;
  onAnalyzeBatch: () => void;
  selectedCount: number;
  totalResults: number;
}

const REGION_COUNTRIES = {
  LATAM: [
    { code: "MX", name: "México" },
    { code: "CO", name: "Colombia" },
    { code: "AR", name: "Argentina" },
    { code: "CL", name: "Chile" },
    { code: "PE", name: "Perú" },
    { code: "EC", name: "Ecuador" },
    { code: "VE", name: "Venezuela" },
    { code: "PA", name: "Panamá" },
    { code: "CR", name: "Costa Rica" },
    { code: "DO", name: "República Dominicana" },
  ],
  US: [
    { code: "US", name: "Estados Unidos" },
    { code: "PR", name: "Puerto Rico" },
  ],
  EU: [
    { code: "ES", name: "España" },
    { code: "IT", name: "Italia" },
    { code: "FR", name: "Francia" },
    { code: "DE", name: "Alemania" },
    { code: "GB", name: "Reino Unido" },
    { code: "PT", name: "Portugal" },
  ],
};

export function SearchConsole({
  filters,
  onFiltersChange,
  onSearch,
  isLoading,
  onSaveBatch,
  onAnalyzeBatch,
  selectedCount,
  totalResults,
}: SearchConsoleProps) {
  const [activeSectorId, setActiveSectorId] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const handleRegionChange = (newRegion: "LATAM" | "US" | "EU") => {
    const defaultCountry = REGION_COUNTRIES[newRegion][0];
    onFiltersChange({
      ...filters,
      region: newRegion,
      countryCode: defaultCountry.code,
      countryName: defaultCountry.name,
      // Si es US o EU no hispano, sugerir filtro hispano activo
      filterSpanish: newRegion === "US" || (newRegion === "EU" && defaultCountry.code !== "ES"),
    });
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const countryObj = REGION_COUNTRIES[filters.region].find((c) => c.code === code);
    onFiltersChange({
      ...filters,
      countryCode: code,
      countryName: countryObj ? countryObj.name : code,
      filterSpanish: filters.region === "US" || (filters.region === "EU" && code !== "ES"),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filters.zone.trim() || !filters.niche.trim()) return;
    onSearch();
  };

  return (
    <div className="space-y-4 rounded-xl border border-radar-border bg-radar-panel p-4 sm:p-5 shadow-xl">
      {/* Selector Geográfico y Formulario de Búsqueda */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Fila 1: Región y País */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-lg border border-radar-borderLight bg-radar-bg p-1 text-xs font-mono">
            {(["LATAM", "US", "EU"] as const).map((reg) => (
              <button
                key={reg}
                type="button"
                onClick={() => handleRegionChange(reg)}
                className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                  filters.region === reg
                    ? "bg-radar-accent text-black shadow-sm"
                    : "text-radar-textMuted hover:text-radar-textLight"
                }`}
              >
                {reg === "US" ? "EE.UU." : reg === "EU" ? "Europa" : "LATAM"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-radar-textMuted">País:</span>
            <select
              value={filters.countryCode}
              onChange={handleCountryChange}
              className="rounded-lg border border-radar-borderLight bg-radar-bg px-3 py-1.5 text-xs text-radar-textLight focus:border-radar-accent focus:outline-none"
            >
              {REGION_COUNTRIES[filters.region].map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Filtro de Audiencia Hispana */}
          {(filters.region === "US" || (filters.region === "EU" && filters.countryCode !== "ES")) && (
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-radar-accent/40 bg-radar-accent/10 px-3 py-1 text-xs text-radar-accent">
              <input
                type="checkbox"
                checked={filters.filterSpanish}
                onChange={(e) => onFiltersChange({ ...filters, filterSpanish: e.target.checked })}
                className="h-3.5 w-3.5 rounded border-radar-accent text-radar-accent focus:ring-0"
              />
              <span className="font-semibold">Destacar & Priorizar Hispanos</span>
            </label>
          )}
        </div>

        {/* Fila 2: Inputs de Zona y Nicho */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          {/* Zona */}
          <div className="sm:col-span-5">
            <label className="mb-1 block text-xs font-mono text-radar-textMuted">
              Zona (Ciudad, Barrio o Código Postal)
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.zone}
                onChange={(e) => onFiltersChange({ ...filters, zone: e.target.value })}
                placeholder="Ej. Miami Downtown, Sevilla, Guadalajara, Medellín..."
                required
                className="w-full rounded-lg border border-radar-borderLight bg-radar-bg px-3.5 py-2.5 text-sm text-radar-textLight placeholder:text-slate-600 focus:border-radar-accent focus:outline-none focus:ring-1 focus:ring-radar-accent"
              />
            </div>
          </div>

          {/* Nicho con Autocompletado */}
          <div className="sm:col-span-5 relative">
            <label className="mb-1 block text-xs font-mono text-radar-textMuted flex items-center justify-between">
              <span>Nicho o Tipo de Negocio</span>
              <span className="text-[10px] text-slate-500 font-normal">Autocompletado +40 sectores</span>
            </label>
            <input
              type="text"
              value={filters.niche}
              onChange={(e) => onFiltersChange({ ...filters, niche: e.target.value })}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setTimeout(() => setIsInputFocused(false), 200)}
              placeholder="Ej. Clínicas dentales, reformas, talleres mecánicos..."
              required
              className="w-full rounded-lg border border-radar-borderLight bg-radar-bg px-3.5 py-2.5 text-sm text-radar-textLight placeholder:text-slate-600 focus:border-radar-accent focus:outline-none focus:ring-1 focus:ring-radar-accent"
            />

            {/* Dropdown de Autocompletado */}
            {isInputFocused && filters.niche.trim().length > 1 && (
              <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-lg border border-radar-borderLight bg-radar-panel p-1.5 shadow-2xl backdrop-blur-md">
                {ALL_NICHE_NAMES.filter((n) =>
                  n.toLowerCase().includes(filters.niche.toLowerCase())
                ).slice(0, 8).map((match) => (
                  <button
                    key={match}
                    type="button"
                    onMouseDown={() => onFiltersChange({ ...filters, niche: match })}
                    className="w-full rounded-md px-2.5 py-1.5 text-left text-xs capitalize text-slate-200 hover:bg-radar-bg hover:text-radar-accent transition-colors flex items-center justify-between"
                  >
                    <span>{match}</span>
                    <span className="text-[10px] font-mono text-slate-500">Sugerencia</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botón Buscar */}
          <div className="flex items-end sm:col-span-2">
            <button
              type="submit"
              disabled={isLoading || !filters.zone.trim() || !filters.niche.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-radar-accent px-4 py-2.5 text-sm font-bold text-black shadow-lg shadow-radar-accent/20 transition-all hover:bg-radar-accentHover disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Explorar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sectores Temáticos y Subnichos Dinámicos */}
        <div className="space-y-2 pt-1 border-t border-radar-border/40">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-400">Sectores:</span>
            {NICHE_CATALOG.map((group) => {
              const isActive = activeSectorId === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setActiveSectorId(isActive ? null : group.id)}
                  className={`rounded-md border px-2 py-0.5 text-[11px] font-mono transition-colors flex items-center gap-1 ${
                    isActive
                      ? "border-radar-accent bg-radar-accent/15 text-radar-accent font-bold"
                      : "border-radar-borderLight bg-radar-bg/60 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>{group.icon}</span>
                  <span>{group.name.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-nichos del sector desplegado */}
          {activeSectorId && (
            <div className="rounded-lg border border-radar-border bg-radar-bg/90 p-2.5 space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-radar-border/50 pb-1">
                <span>
                  {NICHE_CATALOG.find((g) => g.id === activeSectorId)?.name}
                </span>
                <span className="text-[10px] text-slate-500">Haz clic para seleccionar</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {NICHE_CATALOG.find((g) => g.id === activeSectorId)?.niches.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      onFiltersChange({ ...filters, niche: n.name });
                      setActiveSectorId(null);
                    }}
                    className={`rounded-md border px-2.5 py-1 text-xs capitalize transition-all ${
                      filters.niche.toLowerCase() === n.name.toLowerCase()
                        ? "border-radar-blue bg-radar-blue/20 text-radar-blue font-bold shadow-sm"
                        : "border-radar-borderLight bg-radar-panel text-slate-300 hover:border-radar-blue hover:text-white"
                    }`}
                  >
                    <span>{n.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fila 3: Filtros Rápidos (Toggles) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-radar-border/80 pt-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono">
            {/* Solo sin web */}
            <label className="flex cursor-pointer items-center gap-1.5 text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={filters.onlyWithoutWeb}
                onChange={(e) => onFiltersChange({ ...filters, onlyWithoutWeb: e.target.checked })}
                className="h-3.5 w-3.5 rounded border-radar-borderLight bg-radar-bg text-radar-accent focus:ring-0"
              />
              <Globe2 className="h-3.5 w-3.5 text-slate-400" />
              <span>Solo sin web</span>
            </label>

            {/* Solo con teléfono */}
            <label className="flex cursor-pointer items-center gap-1.5 text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={filters.onlyWithPhone}
                onChange={(e) => onFiltersChange({ ...filters, onlyWithPhone: e.target.checked })}
                className="h-3.5 w-3.5 rounded border-radar-borderLight bg-radar-bg text-radar-accent focus:ring-0"
              />
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              <span>Con teléfono</span>
            </label>

            {/* Rating >= 4.0 */}
            <label className="flex cursor-pointer items-center gap-1.5 text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={filters.minRating >= 4.0}
                onChange={(e) =>
                  onFiltersChange({ ...filters, minRating: e.target.checked ? 4.0 : 0 })
                }
                className="h-3.5 w-3.5 rounded border-radar-borderLight bg-radar-bg text-radar-accent focus:ring-0"
              />
              <Star className="h-3.5 w-3.5 text-amber-400" />
              <span>Valoración ≥ 4.0★</span>
            </label>

            {/* Reseñas >= 15 */}
            <label className="flex cursor-pointer items-center gap-1.5 text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={filters.minReviews >= 15}
                onChange={(e) =>
                  onFiltersChange({ ...filters, minReviews: e.target.checked ? 15 : 0 })
                }
                className="h-3.5 w-3.5 rounded border-radar-borderLight bg-radar-bg text-radar-accent focus:ring-0"
              />
              <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
              <span>Reseñas ≥ 15</span>
            </label>

            {/* Ocultar cerrados */}
            <label className="flex cursor-pointer items-center gap-1.5 text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={filters.hideClosed}
                onChange={(e) => onFiltersChange({ ...filters, hideClosed: e.target.checked })}
                className="h-3.5 w-3.5 rounded border-radar-borderLight bg-radar-bg text-radar-accent focus:ring-0"
              />
              <span>Ocultar cerrados</span>
            </label>
          </div>

          {/* Alternador de Vista (Tabla vs Tarjetas) */}
          <div className="flex items-center rounded-lg border border-radar-borderLight bg-radar-bg p-0.5">
            <button
              type="button"
              onClick={() => onFiltersChange({ ...filters, viewMode: "table" })}
              className={`p-1.5 rounded transition-all ${
                filters.viewMode === "table"
                  ? "bg-radar-panel text-radar-accent shadow-sm"
                  : "text-radar-textMuted hover:text-radar-textLight"
              }`}
              title="Vista de Tabla Densa (Estilo Telemetría)"
            >
              <TableIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onFiltersChange({ ...filters, viewMode: "cards" })}
              className={`p-1.5 rounded transition-all ${
                filters.viewMode === "cards"
                  ? "bg-radar-panel text-radar-accent shadow-sm"
                  : "text-radar-textMuted hover:text-radar-textLight"
              }`}
              title="Vista de Tarjetas Visuales"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Barra de Acciones en Lote (cuando hay selección) */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-radar-accent/30 bg-radar-accent/10 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs font-mono text-radar-textLight">
            <CheckSquare className="h-4 w-4 text-radar-accent" />
            <span>
              <strong className="text-radar-accent font-bold">{selectedCount}</strong> prospectos seleccionados
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSaveBatch}
              className="flex items-center gap-1.5 rounded-md border border-radar-borderLight bg-radar-panel px-3 py-1.5 text-xs font-medium text-radar-textLight hover:border-radar-accent transition-colors"
            >
              <Building2 className="h-3.5 w-3.5 text-radar-blue" />
              <span>Guardar en Mis Leads</span>
            </button>

            <button
              type="button"
              onClick={onAnalyzeBatch}
              className="flex items-center gap-1.5 rounded-md bg-radar-accent px-3 py-1.5 text-xs font-bold text-black hover:bg-radar-accentHover transition-colors shadow-md"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Analizar Lote (Máx 2 paralelos)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
