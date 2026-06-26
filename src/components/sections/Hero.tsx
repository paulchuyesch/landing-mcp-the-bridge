"use client";

import { Download } from "lucide-react";
import { IsometricGrid } from "../svg/IsometricGrid";

export function Hero() {
  return (
    <section className="relative border-b border-border">
      <div className="h-16 md:h-20" />

      <div className="min-h-[calc(100vh-4rem)] lg:min-h-0 lg:h-[calc(100vh-5rem)] lg:max-h-[800px] grid grid-cols-1 lg:grid-cols-2">
        <div className="hidden lg:block border-b lg:border-b-0 lg:border-r border-border relative overflow-hidden animate-hero-fade min-h-[300px] lg:min-h-0">
          <IsometricGrid />
        </div>

        <div className="flex flex-col h-full">
          <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:py-0 lg:px-12 animate-hero-up">
            <div className="type-micro inline-flex items-center gap-2 border border-border px-3 py-1 text-xs text-foreground-muted mb-6 w-fit rounded-full">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              THE BRIDGE 1.0 | Protocolo MCP
            </div>

            <h1 className="text-h1 mb-6">
              El Puente Universal
              <br />
              <span className="text-orange-500">IA & E-commerce</span>
            </h1>

            <p className="text-body-lead text-foreground-muted mb-8 max-w-xl">
              Conecta agentes de inteligencia artificial y LLMs directamente con tu tienda online mediante el Model Context Protocol. Seguro, rápido y escalable.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/descargar"
                className="h-12 px-8 bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-all flex items-center justify-center gap-2 btn-pulse"
              >
                <Download className="w-4 h-4" />
                Descargar Plugin
              </a>
            </div>
          </div>

          <div className="border-t border-border grid grid-cols-2 divide-x divide-border animate-hero-up-delayed mt-8 lg:mt-0">
            <div className="p-6 lg:p-8 flex flex-col justify-center">
              <p className="type-micro text-xs text-foreground-subtle uppercase tracking-wider mb-3">Conexión Segura</p>
              <div className="space-y-3 font-sans text-sm">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-foreground font-medium">Sincronización WooCommerce Activa</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-orange-500/80" />
                  </span>
                  <span className="text-foreground-muted">Cifrado de Datos Seguro (HMAC)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-orange-500/80" />
                  </span>
                  <span className="text-foreground-muted">Discovery Beacon Transmitiendo</span>
                </div>
              </div>
            </div>

            <div className="p-6 lg:p-8 flex flex-col justify-center">
              <p className="type-micro text-xs text-foreground-subtle uppercase tracking-wider mb-3">Rendimiento</p>
              <div className="space-y-4">
                <div>
                  <p className="text-h3 text-foreground">Real-time</p>
                  <p className="text-xs text-foreground-subtle">Sincronización</p>
                </div>
                <div>
                  <p className="text-h3 text-foreground">100%</p>
                  <p className="text-xs text-foreground-subtle">Precisión de Catálogo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
