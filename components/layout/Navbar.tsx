"use client";

import React from "react";
import { Radar, Compass, Users, Settings, FileText, Database, Activity, ShieldCheck } from "lucide-react";

export type NavTab = "search" | "niche" | "leads" | "proposals" | "settings";

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  savedLeadsCount: number;
  placesCallCount: number;
  placesLimit: number;
  queueStatus: { active: number; pending: number };
}

export function Navbar({
  currentTab,
  onTabChange,
  savedLeadsCount,
  placesCallCount,
  placesLimit,
  queueStatus,
}: NavbarProps) {
  const isNearQuotaLimit = placesCallCount >= placesLimit;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-radar-border bg-radar-bg/95 backdrop-blur supports-[backdrop-filter]:bg-radar-bg/80">
      {/* HUD Telemetry Bar Superior */}
      <div className="flex h-9 items-center justify-between border-b border-radar-border/60 px-4 text-xs font-mono text-radar-textMuted bg-radar-panel/40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-radar-blue">
            <span className="h-1.5 w-1.5 rounded-full bg-radar-blue animate-pulse" />
            <span className="font-semibold tracking-wider">HIK RADAR v1.0</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">Jose Rivas</span>
          </div>

          <a
            href="https://app.zaps.wtf/creator/Hik18977534"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 text-[11px] text-amber-400/90 hover:text-amber-300 transition-colors"
            title="Verificación On-Chain en ZAPS"
          >
            <ShieldCheck className="h-3 w-3" />
            <span>On-Chain Verificado ($3.8M)</span>
          </a>
        </div>

        {/* HUD Chips telemétricos */}
        <div className="flex items-center gap-3">
          {/* Quota Tracker */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] ${
              isNearQuotaLimit
                ? "border-radar-accent bg-radar-accent/15 text-radar-accent animate-pulse font-bold"
                : "border-radar-borderLight bg-radar-panel text-slate-300"
            }`}
            title="Llamadas a Google Places este mes"
          >
            <Activity className="h-3 w-3" />
            <span>Cuota: {placesCallCount}/{placesLimit}</span>
          </div>

          {/* Caché Status */}
          <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-400">
            <Database className="h-3 w-3 text-radar-blue" />
            <span>Caché 7d</span>
          </div>

          {/* Queue Status */}
          <div className="flex items-center gap-1 text-[11px] text-slate-300">
            <span
              className={`h-2 w-2 rounded-full ${
                queueStatus.active > 0 ? "bg-radar-accent animate-ping" : "bg-emerald-500"
              }`}
            />
            <span>Cola: {queueStatus.active}/2</span>
            {queueStatus.pending > 0 && (
              <span className="text-radar-accent font-mono font-bold">+{queueStatus.pending}</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-radar-borderLight bg-radar-panel text-radar-accent shadow-inner">
            <Radar className="h-5 w-5 animate-[spin_10s_linear_infinite]" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-radar-textLight">
              RADAR DE CLIENTES
            </h1>
            <p className="text-[11px] font-mono text-radar-textMuted hidden sm:block">
              Consola de Prospección & Auditoría Comercial
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onTabChange("search")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
              currentTab === "search"
                ? "bg-radar-panel border border-radar-accent text-radar-accent shadow-md shadow-radar-accent/10"
                : "text-radar-textMuted hover:text-radar-textLight hover:bg-radar-panel/50"
            }`}
          >
            <Radar className="h-4 w-4" />
            <span>Buscar</span>
          </button>

          <button
            onClick={() => onTabChange("niche")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
              currentTab === "niche"
                ? "bg-radar-panel border border-radar-accent text-radar-accent shadow-md shadow-radar-accent/10"
                : "text-radar-textMuted hover:text-radar-textLight hover:bg-radar-panel/50"
            }`}
          >
            <Compass className="h-4 w-4" />
            <span className="hidden sm:inline">Radar de</span> Nichos
          </button>

          <button
            onClick={() => onTabChange("leads")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all relative ${
              currentTab === "leads"
                ? "bg-radar-panel border border-radar-accent text-radar-accent shadow-md shadow-radar-accent/10"
                : "text-radar-textMuted hover:text-radar-textLight hover:bg-radar-panel/50"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Mis Leads</span>
            {savedLeadsCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-radar-accent px-1 text-[10px] font-bold text-black font-mono">
                {savedLeadsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange("proposals")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
              currentTab === "proposals"
                ? "bg-radar-panel border border-radar-accent text-radar-accent shadow-md shadow-radar-accent/10"
                : "text-radar-textMuted hover:text-radar-textLight hover:bg-radar-panel/50"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Propuestas</span>
          </button>

          <button
            onClick={() => onTabChange("settings")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
              currentTab === "settings"
                ? "bg-radar-panel border border-radar-accent text-radar-accent shadow-md shadow-radar-accent/10"
                : "text-radar-textMuted hover:text-radar-textLight hover:bg-radar-panel/50"
            }`}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Ajustes</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
