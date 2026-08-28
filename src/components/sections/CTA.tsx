"use client";

import { ArrowRight } from "lucide-react";
import { WAITLIST_LABEL, WAITLIST_REL, WAITLIST_TARGET, WAITLIST_URL } from "../../lib/waitlist";

export function CTA() {
  return (
    <section id="download" className="relative z-10 overflow-hidden py-24 lg:py-32 border-t border-border">
      {/* Decoración de Puente Abstracto (Simétrico) */}
      <div className="absolute inset-0 pointer-events-none -z-10 opacity-30">
        <svg className="absolute w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
          {/* Pilar izquierdo */}
          <path d="M280 40 L320 40 L310 300 L290 300 Z" fill="currentColor" className="text-foreground-subtle/10" />
          <rect x="290" y="20" width="20" height="20" fill="currentColor" className="text-foreground-subtle/20" />
          
          {/* Pilar derecho */}
          <path d="M680 40 L720 40 L710 300 L690 300 Z" fill="currentColor" className="text-foreground-subtle/10" />
          <rect x="690" y="20" width="20" height="20" fill="currentColor" className="text-foreground-subtle/20" />
          
          {/* Cables */}
          <path d="M0 100 Q 150 250 300 40" fill="none" stroke="currentColor" strokeWidth="4" className="text-orange-500/30" />
          <path d="M300 40 Q 500 280 700 40" fill="none" stroke="currentColor" strokeWidth="4" className="text-orange-500/30" />
          <path d="M700 40 Q 850 250 1000 100" fill="none" stroke="currentColor" strokeWidth="4" className="text-orange-500/30" />
          
          {/* Tensores centrales */}
          <line x1="350" y1="90" x2="350" y2="300" stroke="currentColor" strokeWidth="1" className="text-foreground-muted/20" />
          <line x1="400" y1="135" x2="400" y2="300" stroke="currentColor" strokeWidth="1" className="text-foreground-muted/20" />
          <line x1="450" y1="170" x2="450" y2="300" stroke="currentColor" strokeWidth="1" className="text-foreground-muted/20" />
          <line x1="500" y1="190" x2="500" y2="300" stroke="currentColor" strokeWidth="1" className="text-foreground-muted/20" />
          <line x1="550" y1="170" x2="550" y2="300" stroke="currentColor" strokeWidth="1" className="text-foreground-muted/20" />
          <line x1="600" y1="135" x2="600" y2="300" stroke="currentColor" strokeWidth="1" className="text-foreground-muted/20" />
          <line x1="650" y1="90" x2="650" y2="300" stroke="currentColor" strokeWidth="1" className="text-foreground-muted/20" />
          
          {/* Tensores laterales */}
          <line x1="50" y1="120" x2="50" y2="300" stroke="currentColor" strokeWidth="1" className="text-foreground-muted/20" />
          <line x1="100" y1="145" x2="100" y2="300" stroke="currentColor" strokeWidth="1" className="text-foreground-muted/20" />
          <line x1="150" y1="165" x2="150" y2="300" stroke="currentColor" strokeWidth="1" className="text-foreground-muted/20" />
          <line x1="200" y1="160" x2="200" y2="300" stroke="currentColor" strokeWidth="1" className="text-foreground-muted/20" />
          <line x1="250" y1="115" x2="250" y2="300" stroke="currentColor" strokeWidth="1" className="text-foreground-muted/20" />

          <line x1="750" y1="115" x2="750" y2="300" stroke="currentColor" strokeWidth="1" className="text-foreground-muted/20" />
          <line x1="800" y1="160" x2="800" y2="300" stroke="currentColor" strokeWidth="1" className="text-foreground-muted/20" />
          <line x1="850" y1="165" x2="850" y2="300" stroke="currentColor" strokeWidth="1" className="text-foreground-muted/20" />
          <line x1="900" y1="145" x2="900" y2="300" stroke="currentColor" strokeWidth="1" className="text-foreground-muted/20" />
          <line x1="950" y1="120" x2="950" y2="300" stroke="currentColor" strokeWidth="1" className="text-foreground-muted/20" />
        </svg>
      </div>
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <h2 className="text-h1 mb-6">
            Haz que tu tienda sea <span className="text-orange-500">visible</span> para la IA.
          </h2>

          <p className="text-body-lead text-foreground-muted mb-10 max-w-2xl">
            No pierdas ventas por tener un catálogo inaccesible. Instala THE BRIDGE en minutos y asegura que los agentes autónomos puedan recomendar tus productos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-10 w-full sm:w-auto">
            <a
              href={WAITLIST_URL}
              target={WAITLIST_TARGET}
              rel={WAITLIST_REL}
              className="h-14 px-10 bg-orange-500 text-white text-base font-bold hover:bg-orange-600 transition-all flex items-center justify-center gap-2 w-full sm:w-auto btn-pulse"
            >
              {WAITLIST_LABEL}
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href={WAITLIST_URL}
              target={WAITLIST_TARGET}
              rel={WAITLIST_REL}
              className="h-14 px-10 border border-border text-foreground text-base font-bold hover:bg-background-tertiary transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {WAITLIST_LABEL}
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-foreground-subtle font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-status-stable rounded-full" />
              <span>WooCommerce (Estable)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-status-stable rounded-full" />
              <span>Sincronización en Tiempo Real</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-status-in-progress rounded-full" />
              <span>Shopify (En Desarrollo)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-status-in-progress rounded-full" />
              <span>Plugin ligero para WordPress (sin código)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
