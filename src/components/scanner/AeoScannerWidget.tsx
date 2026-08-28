import React, { useState } from "react";
import { ScannerForm, type ScannerStatus } from "./ScannerForm";
import { ScoreGauge } from "./ScoreGauge";
import { PillarCards } from "./PillarCards";
import { BridgeNextStep } from "./BridgeNextStep";
import type { AeoPublicScanResult } from "../../lib/scanner/core/schemas";
import { ShieldAlert, Bot, Eye, Zap } from "lucide-react";

export function AeoScannerWidget() {
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [scanResult, setScanResult] = useState<AeoPublicScanResult | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [accessBlocked, setAccessBlocked] = useState(false);

  const handleScanRequest = async (url: string) => {
    setServerError(null);
    setScanResult(null);
    setAccessBlocked(false);

    const res = await fetch("/api/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url })
    });

    if (!res.ok) {
      let errorMsg = "Ocurrió un error inesperado al escanear la URL.";
      try {
        const errorData = await res.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch (e) {}
      setServerError(errorMsg);
      throw new Error(errorMsg);
    }

    const data: AeoPublicScanResult = await res.json();
    if (data.accessBlocked) {
      setAccessBlocked(true);
      return;
    }
    setScanResult(data);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center animate-hero-fade">

      {/* Header Section */}
      <div className="text-center max-w-3xl mb-12 mt-20">
        <h1 className="text-h1 mb-6">
          ¿Están los Agentes de IA <span className="text-[#f97316]">ignorando tus productos?</span>
        </h1>
        <p className="text-body-lead text-[var(--color-foreground-muted)]">
          Descubre en segundos si tu e-commerce es <strong className="text-[var(--color-foreground)]">visible para la Inteligencia Artificial</strong> o si estás perdiendo compradores.
        </p>
      </div>

      {/* Input Section */}
      <div className="w-full max-w-2xl mx-auto mb-16 relative z-10 animate-hero-up-delayed">
        <div className="surface-card-dark p-3 rounded-2xl">
          <ScannerForm
            onScanRequest={handleScanRequest}
            status={status}
            setStatus={setStatus}
          />
        </div>
      </div>

      {/* Idle Info Section */}
      {status === "idle" && (
        <div className="w-full max-w-5xl mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 animate-hero-up-delayed" style={{ animationDelay: '0.5s' }}>
          <div className="surface-card-dark p-8 rounded-2xl flex flex-col items-start text-left">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-[rgba(249,115,22,0.1)] text-[#f97316] border border-[rgba(249,115,22,0.2)]">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-h4 mb-3">¿Qué es el AEO?</h3>
            <p className="text-sm text-[var(--color-foreground-muted)] leading-relaxed">
              Agent Engine Optimization. Es la nueva forma de optimizar tu tienda no solo para humanos, sino para que la IA pueda leer y recomendar tus productos.
            </p>
          </div>

          <div className="surface-card-dark p-8 rounded-2xl flex flex-col items-start text-left">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-[rgba(249,115,22,0.1)] text-[#f97316] border border-[rgba(249,115,22,0.2)]">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-h4 mb-3">¿Por qué importa?</h3>
            <p className="text-sm text-[var(--color-foreground-muted)] leading-relaxed">
              Si tu tienda está "ciega" para los agentes de IA, tus productos no aparecerán cuando los usuarios pidan recomendaciones a sus asistentes virtuales.
            </p>
          </div>

          <div className="surface-card-dark p-8 rounded-2xl flex flex-col items-start text-left">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-[rgba(249,115,22,0.1)] text-[#f97316] border border-[rgba(249,115,22,0.2)]">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-h4 mb-3">¿Qué analizamos?</h3>
            <p className="text-sm text-[var(--color-foreground-muted)] leading-relaxed">
              Evaluamos la velocidad, la estructura de datos y la accesibilidad técnica de tu catálogo para asegurar que tu tienda "hable" el idioma de las máquinas.
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {serverError && status === "error" && (
        <div className="w-full max-w-2xl bg-[rgba(239,68,68,0.1)] border border-red-900/50 p-6 rounded-2xl flex flex-col items-center text-center mb-12">
          <div className="bg-red-900/30 p-3 rounded-full mb-4">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-red-400 mb-2">Análisis Fallido</h3>
          <p className="text-red-200">{serverError}</p>
        </div>
      )}

      {status === "results" && accessBlocked && (
        <div className="w-full max-w-2xl border border-orange-500/40 bg-orange-500/10 p-6 rounded-2xl flex flex-col items-center text-center mb-12">
          <div className="bg-orange-500/15 p-3 rounded-full mb-4">
            <ShieldAlert className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-lg font-bold text-orange-300 mb-2">No pudimos obtener un resultado fiable</h3>
          <p className="text-[var(--color-foreground-muted)] leading-relaxed">
            Esta tienda bloqueó las consultas automáticas necesarias para el análisis. No es una puntuación de 0; el scanner no pudo leer suficiente información para evaluarla.
          </p>
        </div>
      )}

      {/* Results Section */}
      {status === "results" && scanResult && (
        <div className="w-full flex flex-col items-center animate-success-pop">

          <div className="w-full max-w-sm mb-16 relative">
            <div className="absolute -inset-4 bg-[#f97316] opacity-10 blur-3xl rounded-full"></div>
            <div className="surface-card p-10 rounded-3xl relative flex flex-col items-center">
              <h3 className="text-h4 mb-8 text-center text-[var(--color-foreground-muted)]">
                Puntuación AEO Global
              </h3>
              <ScoreGauge score={scanResult.totalScore} size={240} strokeWidth={20} />
            </div>
          </div>

          <div className="w-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-h3">
                Desglose Técnico
              </h3>
            </div>
            <PillarCards pillars={scanResult.pillars} />
          </div>

          <BridgeNextStep score={scanResult.totalScore} pillars={scanResult.pillars} />

        </div>
      )}
    </div>
  );
}
