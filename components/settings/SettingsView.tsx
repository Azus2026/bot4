"use client";

import React, { useState } from "react";
import { AppSettings, OutreachTone, SellerProfile } from "@/types/lead";
import {
  Settings,
  Key,
  User,
  ShieldCheck,
  Activity,
  Save,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";

interface SettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  onResetQuota: () => Promise<void>;
}

export function SettingsView({ settings, onSaveSettings, onResetQuota }: SettingsViewProps) {
  const [googleKey, setGoogleKey] = useState(settings.googleCloudApiKey || "");
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey || "");
  const [quotaLimit, setQuotaLimit] = useState(settings.placesApiQuotaLimit || 800);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile>(settings.sellerProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedNotification, setShowSavedNotification] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await onSaveSettings({
        googleCloudApiKey: googleKey.trim(),
        geminiApiKey: geminiKey.trim(),
        placesApiQuotaLimit: Number(quotaLimit),
        sellerProfile,
      });

      setShowSavedNotification(true);
      setTimeout(() => setShowSavedNotification(false), 3000);
    } catch (err) {
      console.error("Error guardando ajustes:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const usagePercent = Math.min(
    100,
    Math.round((settings.placesApiCallCountThisMonth / quotaLimit) * 100)
  );
  const isNearLimit = settings.placesApiCallCountThisMonth >= quotaLimit;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Título de la Sección */}
      <div className="rounded-xl border border-radar-border bg-radar-panel p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-radar-border/80 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-black text-radar-textLight flex items-center gap-2">
              <Settings className="h-5 w-5 text-radar-accent" />
              <span>Ajustes & Centro de Control de Telemetría</span>
            </h2>
            <p className="text-xs text-radar-textMuted mt-1">
              Configuración de credenciales de Google Cloud, perfil de autoridad On-Chain (Jose Rivas / Hik) y control de cuotas.
            </p>
          </div>

          {showSavedNotification && (
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-mono text-emerald-400 animate-fade-in">
              <Check className="h-4 w-4" />
              <span>¡Ajustes guardados con éxito!</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* SECCIÓN 1: CREDENCIALES DE GOOGLE CLOUD */}
          <div className="space-y-3 rounded-xl border border-radar-borderLight bg-radar-bg/70 p-4">
            <h3 className="text-sm font-bold text-radar-textLight flex items-center gap-2 font-mono">
              <Key className="h-4 w-4 text-radar-accent" />
              <span>1. Credenciales de Google Cloud & Gemini</span>
            </h3>
            <p className="text-xs text-slate-400">
              Utilizada para Google Places API (New) y PageSpeed Insights v5. Se guarda únicamente en tu navegador de forma local.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-mono text-radar-textMuted block mb-1">
                  Google Cloud API Key (Places & PageSpeed)
                </label>
                <input
                  type="password"
                  value={googleKey}
                  onChange={(e) => setGoogleKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full rounded-lg border border-radar-borderLight bg-radar-bg px-3 py-2 text-xs font-mono text-radar-textLight placeholder:text-slate-600 focus:outline-none focus:border-radar-accent"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-radar-textMuted block mb-1">
                  Gemini API Key (Opcional si existe en el entorno)
                </label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy... (o déjalo vacío para usar la clave del sistema)"
                  className="w-full rounded-lg border border-radar-borderLight bg-radar-bg px-3 py-2 text-xs font-mono text-radar-textLight placeholder:text-slate-600 focus:outline-none focus:border-radar-accent"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: CONTROL Y HUD DE CUOTA MENSUAL */}
          <div className="space-y-3 rounded-xl border border-radar-borderLight bg-radar-bg/70 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-radar-textLight flex items-center gap-2 font-mono">
                <Activity className="h-4 w-4 text-radar-blue" />
                <span>2. Monitor de Cuota de Google Places (Este Mes)</span>
              </h3>
              <button
                type="button"
                onClick={onResetQuota}
                className="flex items-center gap-1 rounded border border-radar-borderLight px-2 py-1 text-[11px] font-mono text-slate-400 hover:text-white transition-colors"
                title="Reiniciar contador a 0"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reiniciar Ciclo</span>
              </button>
            </div>

            {/* Barra de Progreso */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">
                  Llamadas consumidas:{" "}
                  <strong className={isNearLimit ? "text-radar-accent font-bold" : "text-white"}>
                    {settings.placesApiCallCountThisMonth}
                  </strong>{" "}
                  / {quotaLimit} límite de alerta (Tope gratuito Google: 1.000)
                </span>
                <span className="text-slate-400">{usagePercent}%</span>
              </div>

              <div className="h-3 w-full rounded-full bg-radar-panel border border-radar-border overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isNearLimit
                      ? "bg-radar-accent animate-pulse"
                      : usagePercent > 60
                      ? "bg-amber-400"
                      : "bg-radar-blue"
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>

            {isNearLimit && (
              <div className="rounded-lg border border-radar-accent/40 bg-radar-accent/10 p-3 text-xs text-radar-accent flex items-center gap-2 font-mono">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  Alerta: Has alcanzado el límite preventivo de {quotaLimit} llamadas. Recuerda que Google Maps Platform ofrece hasta 1.000 llamadas gratuitas al mes en el nuevo modelo Places API.
                </span>
              </div>
            )}

            <div className="pt-2">
              <label className="text-xs font-mono text-radar-textMuted block mb-1">
                Límite de Alerta Preventiva (Editable)
              </label>
              <input
                type="number"
                value={quotaLimit}
                onChange={(e) => setQuotaLimit(Number(e.target.value))}
                min={100}
                max={5000}
                className="w-36 rounded-lg border border-radar-borderLight bg-radar-bg px-3 py-1.5 text-xs font-mono text-radar-textLight focus:outline-none focus:border-radar-accent"
              />
            </div>
          </div>

          {/* SECCIÓN 3: PERFIL DE AUTORIDAD ON-CHAIN (JOSE RIVAS / HIK) */}
          <div className="space-y-4 rounded-xl border border-radar-borderLight bg-radar-bg/70 p-4">
            <h3 className="text-sm font-bold text-radar-textLight flex items-center gap-2 font-mono">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <span>3. Perfil del Consultor & Verificación On-Chain (Jose Rivas / Hik)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Estos datos se inyectan en el prompt de Gemini para redactar los borradores de WhatsApp, llamadas y correo con tu autoridad real inmutable.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-mono text-radar-textMuted block mb-1">Nombre Real</label>
                <input
                  type="text"
                  value={sellerProfile.fullName}
                  onChange={(e) =>
                    setSellerProfile({ ...sellerProfile, fullName: e.target.value })
                  }
                  className="w-full rounded-lg border border-radar-borderLight bg-radar-bg px-3 py-2 text-xs text-radar-textLight focus:outline-none focus:border-radar-blue"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-radar-textMuted block mb-1">Marca Comercial</label>
                <input
                  type="text"
                  value={sellerProfile.brandName}
                  onChange={(e) =>
                    setSellerProfile({ ...sellerProfile, brandName: e.target.value })
                  }
                  className="w-full rounded-lg border border-radar-borderLight bg-radar-bg px-3 py-2 text-xs text-radar-textLight focus:outline-none focus:border-radar-blue"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-radar-textMuted block mb-1">
                  Enlace On-Chain Verificado
                </label>
                <input
                  type="text"
                  value={sellerProfile.onchainTrackRecordUrl}
                  onChange={(e) =>
                    setSellerProfile({ ...sellerProfile, onchainTrackRecordUrl: e.target.value })
                  }
                  className="w-full rounded-lg border border-radar-borderLight bg-radar-bg px-3 py-2 text-xs font-mono text-radar-blue focus:outline-none focus:border-radar-blue"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-radar-textMuted block mb-1">
                  Métricas Públicas en Blockchain
                </label>
                <input
                  type="text"
                  value={sellerProfile.volumeGenerated}
                  onChange={(e) =>
                    setSellerProfile({ ...sellerProfile, volumeGenerated: e.target.value })
                  }
                  placeholder="$3.8M USD generados, Top #6 ZAPS..."
                  className="w-full rounded-lg border border-radar-borderLight bg-radar-bg px-3 py-2 text-xs font-mono text-radar-textLight focus:outline-none focus:border-radar-blue"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-radar-textMuted block mb-1">
                Bono de Inversor Fundador (Planos 3D & Remodelación)
              </label>
              <textarea
                value={sellerProfile.specialIncentives}
                onChange={(e) =>
                  setSellerProfile({ ...sellerProfile, specialIncentives: e.target.value })
                }
                rows={2}
                className="w-full rounded-lg border border-radar-borderLight bg-radar-bg p-2 text-xs text-slate-200 focus:outline-none focus:border-radar-blue"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-radar-textMuted block mb-1">
                Tono Predeterminado de Outreach
              </label>
              <select
                value={sellerProfile.defaultTone}
                onChange={(e) =>
                  setSellerProfile({
                    ...sellerProfile,
                    defaultTone: e.target.value as OutreachTone,
                  })
                }
                className="rounded-lg border border-radar-borderLight bg-radar-bg px-3 py-1.5 text-xs text-radar-textLight focus:outline-none"
              >
                <option value="CONSULTIVE">Consultivo (Profesional y Analítico)</option>
                <option value="DIRECT">Directo (Rápido y al grano)</option>
                <option value="DISRUPTIVE">Disruptivo (Enfatizando data on-chain y costos de inacción)</option>
              </select>
            </div>
          </div>

          {/* Botón Guardar */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-radar-accent px-6 py-2.5 text-xs font-bold text-black hover:bg-radar-accentHover transition-all shadow-lg shadow-radar-accent/20 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? "Guardando..." : "Guardar Toda la Configuración"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
