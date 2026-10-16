"use client";

import React, { useState } from "react";
import { ScoreBreakdownItem } from "@/types/lead";
import { Info } from "lucide-react";

interface ScoreBadgeProps {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  breakdown?: ScoreBreakdownItem[];
  showHoverBreakdown?: boolean;
}

export function ScoreBadge({
  score,
  label = "Oportunidad",
  size = "md",
  breakdown,
  showHoverBreakdown = true,
}: ScoreBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Semántica según el valor especificado:
  // 90-100: Azul (#38BDF8)
  // 50-89: Blanco (#F8FAFC)
  // 0-49: Naranja (#F97316)
  let colorClasses = "bg-radar-accent/20 border-radar-accent text-radar-accent";
  let dotColor = "bg-radar-accent";

  if (score >= 90) {
    colorClasses = "bg-radar-blue/20 border-radar-blue text-radar-blue";
    dotColor = "bg-radar-blue";
  } else if (score >= 50) {
    colorClasses = "bg-slate-800/80 border-slate-400 text-radar-textLight";
    dotColor = "bg-radar-textLight";
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-mono font-bold",
    md: "px-2.5 py-1 text-sm font-mono font-bold",
    lg: "px-3.5 py-1.5 text-base font-mono font-black",
  };

  return (
    <div className="relative inline-block">
      <div
        className={`inline-flex items-center gap-1.5 rounded border ${colorClasses} ${sizeClasses[size]} cursor-help transition-all hover:scale-105`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        <span className={`inline-block h-2 w-2 rounded-full ${dotColor} animate-pulse`} />
        <span>{score}/100</span>
        {breakdown && breakdown.length > 0 && showHoverBreakdown && (
          <Info className="h-3 w-3 opacity-70" />
        )}
      </div>

      {/* Popover con desglose matemático */}
      {showTooltip && breakdown && breakdown.length > 0 && showHoverBreakdown && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-radar-borderLight bg-radar-panel p-3 text-xs shadow-2xl backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between border-b border-radar-border pb-1 font-semibold text-radar-textLight">
            <span>Desglose de {label}</span>
            <span className="font-mono text-radar-accent">{score} pts</span>
          </div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {breakdown.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2 text-slate-300">
                <span className="leading-tight">{item.label}</span>
                <span
                  className={`font-mono font-bold whitespace-nowrap ${
                    item.points > 0
                      ? "text-radar-blue"
                      : item.points < 0
                      ? "text-radar-accent"
                      : "text-slate-400"
                  }`}
                >
                  {item.points > 0 ? `+${item.points}` : item.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
