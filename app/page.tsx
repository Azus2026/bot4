"use client";

import React, { useState, useEffect } from "react";
import { AppSettings, BusinessLead, LeadStatus, SearchCacheEntry } from "@/types/lead";
import { DataRepository, DEFAULT_SETTINGS } from "@/lib/db";
import { AnalysisQueue } from "@/lib/queue";
import { Navbar, NavTab } from "@/components/layout/Navbar";
import { Radar3DCanvas } from "@/components/layout/Radar3DCanvas";
import { SearchConsole, SearchFilters } from "@/components/search/SearchConsole";
import { ResultsTable } from "@/components/search/ResultsTable";
import { ResultsCards } from "@/components/search/ResultsCards";
import { LeadDetailModal } from "@/components/lead/LeadDetailModal";
import { NicheRadarView } from "@/components/radar/NicheRadarView";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { SettingsView } from "@/components/settings/SettingsView";
import { ProposalsView } from "@/components/proposals/ProposalsView";
import { SearchHistoryModal } from "@/components/search/SearchHistoryModal";
import { checkStatusTransition } from "@/lib/proposal/workflow";
import {
  Loader2,
  AlertCircle,
  Database,
  Layers,
  ChevronDown,
  Sparkles,
  Minimize2,
  Maximize2,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  const [currentTab, setCurrentTab] = useState<NavTab>("search");
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [savedLeads, setSavedLeads] = useState<BusinessLead[]>([]);
  const [searchResults, setSearchResults] = useState<BusinessLead[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [activeModalLead, setActiveModalLead] = useState<BusinessLead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState<number>(0);

  // Estados de Búsqueda y Paginación
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [sortBy, setSortBy] = useState<string>("default");

  // Estado de Análisis en Lote
  const [batchProgress, setBatchProgress] = useState<{ total: number; completed: number } | null>(
    null
  );

  // Estado de Cola y Dock 3D
  const [queueStatus, setQueueStatus] = useState({ active: 0, pending: 0 });
  const [isDockMinimized, setIsDockMinimized] = useState(false);

  // Filtros de Búsqueda
  const [filters, setFilters] = useState<SearchFilters>({
    region: "LATAM",
    countryCode: "MX",
    countryName: "México",
    zone: "",
    niche: "",
    filterSpanish: false,
    onlyWithoutWeb: false,
    onlyWithPhone: false,
    minRating: 0,
    minReviews: 0,
    hideClosed: true,
    viewMode: "table",
  });

  const refreshHistoryCount = async () => {
    try {
      const entries = await DataRepository.getAllCachedSearches();
      setHistoryCount(entries.length);
    } catch {
      setHistoryCount(0);
    }
  };

  // Cargar Ajustes, Leads y Búsqueda Activa de IndexedDB al inicio
  useEffect(() => {
    DataRepository.getSettings().then((s) => setSettings(s));
    DataRepository.getAllLeads().then((l) => setSavedLeads(l));

    // Restaurar automáticamente la última búsqueda activa guardada
    DataRepository.getActiveSearchState().then((active) => {
      if (active && active.results && active.results.length > 0) {
        setSearchResults(active.results);
        if (active.filters) setFilters(active.filters);
        setIsFromCache(active.isFromCache ?? true);
        setNextPageToken(active.nextPageToken ?? null);
      }
    });

    refreshHistoryCount();

    // Suscripción a la cola de concurrencia
    const unsubscribe = AnalysisQueue.getInstance().subscribe((active, pending) => {
      setQueueStatus({ active, pending });
    });

    return () => unsubscribe();
  }, []);

  // Set de IDs guardados para marcación rápida
  const savedIdsSet = new Set(savedLeads.map((l) => l.id));

  // Ejecución de Búsqueda
  const handleSearch = async () => {
    if (!filters.zone.trim() || !filters.niche.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setIsFromCache(false);
    setSelectedLeadIds([]);

    const cacheKey = `search_${filters.countryCode}_${filters.zone.toLowerCase()}_${filters.niche.toLowerCase()}_sp${filters.filterSpanish}`;

    try {
      // 1. Revisar Caché IndexedDB (7 días de vigencia)
      const cached = await DataRepository.getCachedSearch(cacheKey);
      if (cached && cached.results.length > 0) {
        setSearchResults(cached.results);
        setNextPageToken(cached.nextPageToken || null);
        setIsFromCache(true);
        setIsSearching(false);
        await DataRepository.saveActiveSearchState({
          filters,
          results: cached.results,
          isFromCache: true,
          nextPageToken: cached.nextPageToken || null,
        });
        return;
      }

      // 2. Si no está en caché, llamar al endpoint de Google Places (New)
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `${filters.niche} en ${filters.zone}`,
          regionCode: filters.countryCode,
          countryName: filters.countryName,
          filterSpanish: filters.filterSpanish,
          apiKey: settings.googleCloudApiKey,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Error en la búsqueda (${res.status})`);
      }

      const data = await res.json();
      const places: BusinessLead[] = data.places || [];

      // Incrementar contador de cuota
      const newCount = await DataRepository.incrementQuotaCounter();
      setSettings((prev) => ({ ...prev, placesApiCallCountThisMonth: newCount }));

      // Guardar en Caché IndexedDB
      const cacheEntry: SearchCacheEntry = {
        cacheKey,
        query: `${filters.niche} en ${filters.zone}`,
        region: filters.region,
        country: filters.countryCode,
        countryName: filters.countryName,
        zone: filters.zone,
        niche: filters.niche,
        filterSpanish: filters.filterSpanish,
        results: places,
        nextPageToken: data.nextPageToken,
        timestamp: Date.now(),
      };
      await DataRepository.setCachedSearch(cacheEntry);
      await DataRepository.saveActiveSearchState({
        filters,
        results: places,
        isFromCache: false,
        nextPageToken: data.nextPageToken || null,
      });
      refreshHistoryCount();

      setSearchResults(places);
      setNextPageToken(data.nextPageToken || null);
    } catch (err: any) {
      setSearchError(err.message || "Error inesperado al buscar en Google Places.");
    } finally {
      setIsSearching(false);
    }
  };

  // Restaurar búsqueda desde el Historial en Caché
  const handleRestoreSearch = async (entry: SearchCacheEntry) => {
    const restoredFilters: SearchFilters = {
      ...filters,
      region: (entry.region as any) || filters.region,
      countryCode: entry.country || filters.countryCode,
      countryName: entry.countryName || filters.countryName,
      zone: entry.zone || entry.query.split(" en ")[1] || filters.zone,
      niche: entry.niche || entry.query.split(" en ")[0] || filters.niche,
      filterSpanish: entry.filterSpanish ?? filters.filterSpanish,
    };
    setFilters(restoredFilters);
    setSearchResults(entry.results || []);
    setIsFromCache(true);
    setNextPageToken(entry.nextPageToken || null);
    setSearchError(null);
    setSelectedLeadIds([]);
    await DataRepository.saveActiveSearchState({
      filters: restoredFilters,
      results: entry.results || [],
      isFromCache: true,
      nextPageToken: entry.nextPageToken || null,
    });
  };

  // Cargar Más Resultados (Paginación con retardo de 2 segundos de Google)
  const handleLoadMore = async () => {
    if (!nextPageToken || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      // Esperar 2 segundos para asegurar la activación del token en Google Maps Platform
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `${filters.niche} en ${filters.zone}`,
          regionCode: filters.countryCode,
          pageToken: nextPageToken,
          filterSpanish: filters.filterSpanish,
          apiKey: settings.googleCloudApiKey,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "No se pudieron cargar más resultados");
      }

      const data = await res.json();
      const newPlaces: BusinessLead[] = data.places || [];

      // Incrementar cuota
      const newCount = await DataRepository.incrementQuotaCounter();
      setSettings((prev) => ({ ...prev, placesApiCallCountThisMonth: newCount }));

      setSearchResults((prev) => [...prev, ...newPlaces]);
      setNextPageToken(data.nextPageToken || null);
    } catch (err: any) {
      setSearchError(err.message || "Error al cargar más resultados.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Manejo de Selección Múltiple
  const handleToggleSelect = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeadIds.length === displayedLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(displayedLeads.map((l) => l.id));
    }
  };

  // Guardar un Lead individual
  const handleSaveLead = async (lead: BusinessLead) => {
    await DataRepository.saveLead(lead);
    const updated = await DataRepository.getAllLeads();
    setSavedLeads(updated);
  };

  // Guardar Lote de Leads
  const handleSaveBatch = async () => {
    const leadsToSave = searchResults.filter((l) => selectedLeadIds.includes(l.id));
    if (leadsToSave.length === 0) return;

    await DataRepository.saveLeadsBatch(leadsToSave);
    const updated = await DataRepository.getAllLeads();
    setSavedLeads(updated);
    setSelectedLeadIds([]);
  };

  // Analizar Lote de Leads con Concurrencia (Máx 2 paralelos)
  const handleAnalyzeBatch = async () => {
    const leadsToAnalyze = searchResults.filter((l) => selectedLeadIds.includes(l.id));
    if (leadsToAnalyze.length === 0) return;

    setBatchProgress({ total: leadsToAnalyze.length, completed: 0 });

    const queue = AnalysisQueue.getInstance();
    let completedCount = 0;

    for (const lead of leadsToAnalyze) {
      queue.enqueue(async () => {
        try {
          // Auditoría PageSpeed si tiene web
          let pageSpeedScores = undefined;
          let screenshotBase64 = undefined;

          if (lead.websiteType === "CUSTOM_WEBSITE" && lead.websiteUri) {
            try {
              const psRes = await fetch("/api/pagespeed", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  url: lead.websiteUri,
                  apiKey: settings.googleCloudApiKey,
                }),
              });
              if (psRes.ok) {
                const psData = await psRes.json();
                pageSpeedScores = psData.scores;
                screenshotBase64 = psData.screenshotBase64;
              }
            } catch (e) {
              console.warn("Fallo PageSpeed en lote para:", lead.name);
            }
          }

          // Auditoría Gemini Flash
          const geminiRes = await fetch("/api/gemini", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lead,
              sellerProfile: settings.sellerProfile,
              pageSpeedScores,
              tone: settings.sellerProfile.defaultTone,
              apiKey: settings.googleCloudApiKey,
              geminiApiKey: settings.geminiApiKey,
            }),
          });

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            const auditResult = geminiData.data;

            const { calculateDefinitiveScore } = await import("@/lib/scoring");
            const webAuditPayload = {
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
              status: "ANALIZADO",
            };

            // Guardar automáticamente en IndexedDB
            await DataRepository.saveLead(updatedLead);

            // Actualizar vista local
            setSearchResults((prev) => prev.map((l) => (l.id === lead.id ? updatedLead : l)));
          }
        } finally {
          completedCount++;
          setBatchProgress({ total: leadsToAnalyze.length, completed: completedCount });
        }
      });
    }

    // Refrescar leads guardados
    const allLeads = await DataRepository.getAllLeads();
    setSavedLeads(allLeads);
  };

  // Abrir Ficha Técnica del Lead
  const handleOpenLead = (lead: BusinessLead) => {
    setActiveModalLead(lead);
    setIsModalOpen(true);
  };

  // Actualizar un lead desde el Modal
  const handleUpdateLeadFromModal = async (updatedLead: BusinessLead) => {
    setActiveModalLead(updatedLead);
    setSearchResults((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
    await DataRepository.saveLead(updatedLead);
    const allSaved = await DataRepository.getAllLeads();
    setSavedLeads(allSaved);
  };

  // Filtrado y ordenamiento reactivo en el cliente para la consola de resultados
  const filteredList = searchResults.filter((lead) => {
    if (filters.onlyWithoutWeb && lead.websiteType === "CUSTOM_WEBSITE") return false;
    if (filters.onlyWithPhone && !lead.phone) return false;
    if (filters.minRating > 0 && lead.googleRating < filters.minRating) return false;
    if (filters.minReviews > 0 && lead.userRatingCount < filters.minReviews) return false;
    if (filters.hideClosed && lead.businessStatus !== "OPERATIONAL") return false;
    return true;
  });

  const displayedLeads = [...filteredList].sort((a, b) => {
    if (sortBy === "reviews_desc") {
      return b.userRatingCount - a.userRatingCount;
    }
    if (sortBy === "reviews_asc") {
      return a.userRatingCount - b.userRatingCount;
    }
    if (sortBy === "rating_desc") {
      return b.googleRating - a.googleRating;
    }
    if (sortBy === "rating_asc") {
      return a.googleRating - b.googleRating;
    }
    if (sortBy === "score_desc") {
      return (b.definitiveScore ?? b.preliminaryScore) - (a.definitiveScore ?? a.preliminaryScore);
    }
    // Por defecto: hispanos primero, luego por score
    if (a.isSpanishTarget && !b.isSpanishTarget) return -1;
    if (!a.isSpanishTarget && b.isSpanishTarget) return 1;
    return (b.definitiveScore ?? b.preliminaryScore) - (a.definitiveScore ?? a.preliminaryScore);
  });

  // Salto desde Radar de Nichos a Búsqueda
  const handleSelectNicheFromRadar = (niche: string, zone: string, countryCode: string) => {
    setFilters((prev) => ({
      ...prev,
      niche,
      zone,
      countryCode,
    }));
    setCurrentTab("search");
    // Disparar búsqueda automática
    setTimeout(() => {
      handleSearch();
    }, 200);
  };

  return (
    <div className="min-h-screen bg-radar-bg flex flex-col">
      {/* Barra de Navegación & HUD */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        savedLeadsCount={savedLeads.length}
        placesCallCount={settings.placesApiCallCountThisMonth}
        placesLimit={settings.placesApiQuotaLimit}
        queueStatus={queueStatus}
      />

      {/* Barra de Progreso de Análisis en Lote */}
      {batchProgress && (
        <div className="bg-radar-panel border-b border-radar-accent/30 px-4 py-2 flex items-center justify-between text-xs font-mono text-radar-accent">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>
              Analizando lote de prospectos: {batchProgress.completed} de {batchProgress.total} completados...
            </span>
          </div>
          {batchProgress.completed === batchProgress.total && (
            <button
              onClick={() => setBatchProgress(null)}
              className="text-slate-400 hover:text-white"
            >
              Cerrar
            </button>
          )}
        </div>
      )}

      {/* Contenido Principal según Pestaña */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* PANTALLA 1: BÚSQUEDA Y PROSPECCIÓN GEOGRÁFICA */}
        {currentTab === "search" && (
          <div className="space-y-5">
            {/* Consola de Filtros */}
            <SearchConsole
              filters={filters}
              onFiltersChange={(newF) => {
                setFilters(newF);
                DataRepository.saveActiveSearchState({
                  filters: newF,
                  results: searchResults,
                  isFromCache,
                  nextPageToken,
                });
              }}
              onSearch={handleSearch}
              isLoading={isSearching}
              onSaveBatch={handleSaveBatch}
              onAnalyzeBatch={handleAnalyzeBatch}
              selectedCount={selectedLeadIds.length}
              totalResults={displayedLeads.length}
              onOpenHistory={() => setIsHistoryModalOpen(true)}
              historyCount={historyCount}
            />

            {/* Aviso de Caché */}
            {isFromCache && (
              <div className="flex items-center justify-between rounded-lg border border-radar-blue/40 bg-radar-blue/10 px-4 py-2 text-xs font-mono text-radar-blue">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span>
                    Resultados cargados desde la Caché Local IndexedDB (0 llamadas consumidas a Google Places).
                  </span>
                </div>
                <button
                  onClick={() => handleSearch()}
                  className="underline hover:text-white transition-colors"
                >
                  Refrescar desde Google
                </button>
              </div>
            )}

            {/* Error en Búsqueda */}
            {searchError && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-xs text-rose-300 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
                <div>
                  <h4 className="font-bold text-sm">Error en la consulta</h4>
                  <p className="mt-0.5 leading-relaxed">{searchError}</p>
                </div>
              </div>
            )}

            {/* Resultados */}
            {displayedLeads.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-radar-textMuted px-1">
                  <span>
                    Mostrando <strong className="text-white">{displayedLeads.length}</strong> prospectos encontrados en{" "}
                    <strong className="text-radar-accent">{filters.zone}</strong>
                  </span>

                  {/* Selector explícito de ordenamiento */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Ordenar por:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="rounded-lg border border-radar-borderLight bg-radar-panel px-2.5 py-1 text-xs font-mono text-radar-textLight focus:outline-none focus:border-radar-accent"
                    >
                      <option value="default">Por defecto (Hispanos + Oportunidad)</option>
                      <option value="reviews_desc">Mayor número de reseñas (Mayor a menor)</option>
                      <option value="reviews_asc">Menor número de reseñas (Menor a mayor)</option>
                      <option value="rating_desc">Mayor valoración (Rating 5★ a 1★)</option>
                      <option value="rating_asc">Menor valoración (Rating 1★ a 5★)</option>
                      <option value="score_desc">Mayor puntuación de oportunidad</option>
                    </select>
                  </div>
                </div>

                {filters.viewMode === "table" ? (
                  <ResultsTable
                    leads={displayedLeads}
                    selectedIds={selectedLeadIds}
                    onToggleSelect={handleToggleSelect}
                    onSelectAll={handleSelectAll}
                    onOpenLead={handleOpenLead}
                    onSaveLead={handleSaveLead}
                    savedLeadIds={savedIdsSet}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                  />
                ) : (
                  <ResultsCards
                    leads={displayedLeads}
                    selectedIds={selectedLeadIds}
                    onToggleSelect={handleToggleSelect}
                    onOpenLead={handleOpenLead}
                    onSaveLead={handleSaveLead}
                    savedLeadIds={savedIdsSet}
                  />
                )}

                {/* Botón Cargar Más */}
                {nextPageToken && (
                  <div className="flex justify-center pt-4">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="flex items-center gap-2 rounded-xl border border-radar-borderLight bg-radar-panel hover:border-radar-accent px-6 py-3 text-xs font-mono font-bold text-radar-textLight transition-all shadow-lg hover:shadow-radar-accent/10 disabled:opacity-50"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-radar-accent" />
                          <span>Esperando sincronización de token de Google (2s)...</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 text-radar-accent" />
                          <span>Cargar 20 resultados más (Máx 60 por búsqueda)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : !isSearching && !searchError ? (
              <div className="rounded-xl border border-radar-border bg-radar-panel p-12 text-center text-slate-400 space-y-3 shadow-xl">
                <div className="flex justify-center">
                  <div className="h-12 w-12 rounded-xl bg-radar-bg border border-radar-border flex items-center justify-center text-radar-accent">
                    <Layers className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-radar-textLight">
                  Consola de Prospección Lista
                </h3>
                <p className="text-xs text-radar-textMuted max-w-md mx-auto">
                  Selecciona tu país, ingresa la ciudad y el nicho a prospectar (ej. «talleres mecánicos en Sevilla»). El radar calculará el score y detectará si tienen web propia o redes sociales.
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* PANTALLA 2: RADAR DE NICHOS */}
        {currentTab === "niche" && (
          <NicheRadarView
            onSelectNicheForSearch={handleSelectNicheFromRadar}
            googleApiKey={settings.googleCloudApiKey}
            defaultZone={filters.zone}
            defaultCountryCode={filters.countryCode}
          />
        )}

        {/* PANTALLA 3: MIS LEADS (CRM KANBAN) */}
        {currentTab === "leads" && (
          <KanbanBoard
            leads={savedLeads}
            onUpdateLeadStatus={async (id, status) => {
              const current = savedLeads.find((l) => l.id === id);
              const blocked = current ? checkStatusTransition(current, status) : null;
              if (blocked) {
                alert(blocked);
                return;
              }
              await DataRepository.updateLeadStatus(id, status);
              const updated = await DataRepository.getAllLeads();
              setSavedLeads(updated);
            }}
            onOpenLead={handleOpenLead}
            onDeleteLead={async (id) => {
              await DataRepository.deleteLead(id);
              const updated = await DataRepository.getAllLeads();
              setSavedLeads(updated);
            }}
          />
        )}

        {/* PANTALLA: PROPUESTAS (Top-N por ciudad + generador, con aprobación manual) */}
        {currentTab === "proposals" && (
          <ProposalsView
            leads={savedLeads}
            settings={settings}
            onSaveLead={async (lead) => {
              await DataRepository.saveLead(lead);
              setSavedLeads(await DataRepository.getAllLeads());
            }}
            onSaveSettings={async (partial) => {
              setSettings(await DataRepository.updateSettings(partial));
            }}
            onOpenLead={handleOpenLead}
          />
        )}

        {/* PANTALLA 4: AJUSTES */}
        {currentTab === "settings" && (
          <SettingsView
            settings={settings}
            onSaveSettings={async (newSet) => {
              const updated = await DataRepository.updateSettings(newSet);
              setSettings(updated);
            }}
            onResetQuota={async () => {
              const updated = await DataRepository.updateSettings({
                placesApiCallCountThisMonth: 0,
                lastQuotaResetDate: new Date().toISOString(),
              });
              setSettings(updated);
            }}
          />
        )}
      </main>

      {/* DOCK 3D FLOTANTE (Three.js Holograma Orbital de Telemetría) */}
      <div className="fixed bottom-4 right-4 z-30 hidden sm:block">
        <div className="rounded-2xl border border-radar-border bg-radar-panel/90 p-2.5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-radar-border/60 pb-1 px-1">
            <span className="text-[10px] font-mono text-radar-blue font-bold">TELEMETRÍA 3D</span>
            <button
              onClick={() => setIsDockMinimized(!isDockMinimized)}
              className="text-slate-500 hover:text-white"
            >
              {isDockMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
            </button>
          </div>

          {!isDockMinimized && (
            <div className="pt-2">
              <Radar3DCanvas
                isScanning={isSearching || isLoadingMore}
                activeLeadCount={displayedLeads.length}
              />
            </div>
          )}
        </div>
      </div>

      {/* MODAL FICHA TÉCNICA Y AUDITORÍA DEL NEGOCIO */}
      {isModalOpen && activeModalLead && (
        <LeadDetailModal
          lead={activeModalLead}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUpdateLead={handleUpdateLeadFromModal}
          sellerProfile={settings.sellerProfile}
          googleApiKey={settings.googleCloudApiKey}
          geminiApiKey={settings.geminiApiKey}
        />
      )}

      {/* MODAL HISTORIAL DE BÚSQUEDAS EN DISCO LOCAL ($0.00) */}
      <SearchHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          refreshHistoryCount();
        }}
        onSelectSearch={handleRestoreSearch}
      />
    </div>
  );
}
