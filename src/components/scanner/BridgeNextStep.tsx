import React from "react";
import { ArrowRight } from "lucide-react";
import { WAITLIST_LABEL, WAITLIST_REL, WAITLIST_TARGET, WAITLIST_URL } from "../../lib/waitlist";
import type { PillarResult } from "../../lib/scanner/core/schemas";

const benefits = [
  {
    number: "01",
    title: "Catálogo más claro para IA",
    description: "Ordena la información que los agentes necesitan para entender y recomendar tus productos.",
  },
  {
    number: "02",
    title: "Datos que se mantienen al día",
    description: "Conecta los cambios de tu tienda para que la información de catálogo no se quede atrás.",
  },
  {
    number: "03",
    title: "Base para vender con agentes",
    description: "Prepara tu WooCommerce para experiencias de búsqueda, recomendación y asistencia con IA.",
  },
];

interface Props {
  score: number;
  pillars: PillarResult[];
}

export const GREEN_SCORE_THRESHOLD = 80;

export const isGreenScore = (score: number): boolean => score >= GREEN_SCORE_THRESHOLD;

export const hasMcpEnrichment = (pillars: PillarResult[]): boolean =>
  pillars.some((pillar) =>
    pillar.pillar === "ai_enrichment" && pillar.maxScore > 0 && pillar.score === pillar.maxScore,
  );

export function BridgeNextStep({ score, pillars }: Props) {
  const mcpDetected = hasMcpEnrichment(pillars);

  if (isGreenScore(score)) {
    return (
      <section className="w-full mt-16 pt-10 md:pt-12 border-t border-[var(--color-border)]">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-7">
          <div className="max-w-3xl">
            <p className="type-micro text-xs uppercase tracking-[0.18em] text-[var(--color-status-stable)] mb-4">
              Resultado sólido
            </p>
            <h3 className="text-h3 max-w-2xl">Tu tienda ya está bien preparada para la IA</h3>
            <p className="mt-4 text-base text-[var(--color-foreground-muted)] leading-relaxed">
              {mcpDetected
                ? `Alcanzaste ${score}/100 en esta auditoría pública. Tu tienda ya muestra una capa compatible con agentes; revisa los puntos restantes para seguir mejorando.`
                : `Alcanzaste ${score}/100 en esta auditoría pública: tienes una base sólida. Aún no detectamos una capa MCP pública; con una solución como Bridge puedes desbloquear el camino hacia 100.`}
            </p>
          </div>
          <a
            href={WAITLIST_URL}
            target={WAITLIST_TARGET}
            rel={WAITLIST_REL}
            className="btn-secondary h-11 px-6 inline-flex items-center justify-center gap-2 whitespace-nowrap self-start lg:self-auto"
          >
            <span>{WAITLIST_LABEL}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full mt-16 pt-14 md:pt-16 border-t border-[var(--color-border)]">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-8 lg:gap-14 items-end">
        <div>
          <p className="type-micro text-xs uppercase tracking-[0.18em] text-[#f97316] mb-4">El siguiente paso</p>
          <h3 className="text-h2 max-w-2xl">Convierte este diagnóstico en mejoras reales</h3>
        </div>
        <p className="text-body-lead text-[var(--color-foreground-muted)] leading-relaxed lg:pb-1">
          Esta auditoría muestra qué puede leer hoy un agente de IA. MCP Bridge conecta tu tienda para trabajar sobre esos datos y prepararla para las nuevas experiencias de compra asistidas por IA.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 mt-12 border-y border-[var(--color-border)] divide-y md:divide-y-0 md:divide-x divide-[var(--color-border)]">
        {benefits.map(({ number, title, description }) => (
          <div key={number} className="py-8 md:px-7 first:md:pl-0 last:md:pr-0">
            <p className="type-micro text-xs tracking-[0.16em] text-[#f97316] mb-4">{number}</p>
            <h4 className="font-bold text-[var(--color-foreground)] mb-3">{title}</h4>
            <p className="text-sm text-[var(--color-foreground-muted)] leading-relaxed">{description}</p>
          </div>
        ))}
      </div>

      <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <p className="text-sm text-[var(--color-foreground-muted)] max-w-lg">
          Instala Bridge cuando quieras pasar del diagnóstico a una tienda preparada para agentes.
        </p>
        <a href={WAITLIST_URL} target={WAITLIST_TARGET} rel={WAITLIST_REL} className="btn-primary h-12 px-7 inline-flex items-center justify-center gap-2 whitespace-nowrap">
          <span>{WAITLIST_LABEL}</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
}
