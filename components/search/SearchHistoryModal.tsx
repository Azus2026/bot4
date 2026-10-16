"use client";

import React, { useState, useEffect } from "react";
import { SearchCacheEntry } from "@/types/lead";
import { DataRepository } from "@/lib/db";
import {
  History,
  X,
  Trash2,
  Database,
  ArrowRight,
  Clock,
  Sparkles,
  MapPin,
  Building,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface SearchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSearch: (entry: SearchCacheEntry) => void;
}

export function SearchHistoryModal({
  isOpen,
  onClose,
  onSelectSearch,
}: SearchHistoryModalProps) {
  const [history, setHistory] = useState<SearchCacheEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);

  const loadHistory = async () => {
    setIsLoading(true);
    const entries = await DataRepository.getAllCachedSearches();
    setHistory(entries);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      setConfirmClear(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeleteEntry = async (cacheKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await DataRepository.deleteCachedSearch(cacheKey);
    setHistory((prev) => prev.filter((item) => item.cacheKey !== cacheKey));
  };

  const handleClearAll = async () => {
    await DataRepository.clearAllCachedSearches();
    setHistory([]);
    setConfirmClear(false);
  };

  const formatRelativeTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Hace unos segundos";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border border-radar-border bg-radar-panel p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-radar-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-radar-blue/40 bg-radar-blue/10 text-radar-blue">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-radar-textLight">
                  Historial de Búsquedas en Disco Local
                </h3>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-mono text-emerald-400">
                  Costo: $0.00
                </span>
              </div>
              <p className="text-xs text-radar-textMuted mt-0.5">
                Carga instantáneamente tus prospectos anteriores guardados en caché sin consumir tu cuota de Google Places.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-radar-bg hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar de Acciones */}
        <div className="flex items-center justify-between text-xs font-mono text-radar-textMuted px-1">
          <span>
            {history.length} búsqueda{history.length !== 1 ? "s" : ""} disponible
            {history.length !== 1 ? "s" : ""} en memoria (TTL: 7 días)
          </span>

          {history.length > 0 && (
            <div>
              {confirmClear ? (
                <div className="flex items-center gap-2 animate-fadeIn">
                  <span className="text-rose-400">¿Borrar todo el historial?</span>
                  <button
                    onClick={handleClearAll}
                    className="rounded bg-rose-600 px-2 py-1 text-white hover:bg-rose-700"
                  >
                    Sí, vaciar
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="rounded bg-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-600"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Vaciar historial</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Lista de Búsquedas */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-radar-textMuted font-mono">
              Cargando historial de disco local...
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Database className="mx-auto h-10 w-10 text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">
                Aún no tienes búsquedas en el historial
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Cada vez que busques negocios en una ciudad o nicho, se guardarán aquí automáticamente durante 7 días para que los vuelvas a abrir sin gastar llamadas de Google Maps.
              </p>
            </div>
          ) : (
            history.map((entry) => {
              const resultCount = entry.results?.length || 0;
              return (
                <div
                  key={entry.cacheKey}
                  onClick={() => {
                    onSelectSearch(entry);
                    onClose();
                  }}
                  className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-radar-borderLight bg-radar-bg/80 p-3.5 hover:border-radar-blue hover:bg-radar-bg transition-all cursor-pointer shadow-sm hover:shadow-radar-blue/5"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-radar-textLight group-hover:text-radar-blue transition-colors">
                        {entry.niche || entry.query.split(" en ")[0] || entry.query}
                      </span>
                      <span className="text-slate-500 text-xs">en</span>
                      <span className="text-radar-accent font-semibold text-xs flex items-center gap-1">
                        <MapPin className="h-3 w-3 inline" />
                        {entry.zone || entry.query.split(" en ")[1] || entry.country}
                      </span>
                      <span className="rounded bg-radar-panel border border-radar-borderLight px-1.5 py-0.2 text-[10px] font-mono text-slate-300">
                        {entry.country}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono flex-wrap">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {resultCount} prospectos
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(entry.timestamp)}
                      </span>
                      {entry.filterSpanish && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400 text-[10px]">Filtro Hispano</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded-lg border border-radar-blue/40 bg-radar-blue/10 px-3 py-1.5 text-xs font-bold text-radar-blue group-hover:bg-radar-blue group-hover:text-black transition-all"
                    >
                      <span>Cargar ($0.00)</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteEntry(entry.cacheKey, e)}
                      title="Eliminar de la caché"
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-radar-border/60 pt-3 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>💡 Las búsquedas se renuevan automáticamente a los 7 días.</span>
          <button
            onClick={onClose}
            className="rounded-lg border border-radar-borderLight bg-radar-bg px-4 py-1.5 text-slate-300 hover:text-white transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
