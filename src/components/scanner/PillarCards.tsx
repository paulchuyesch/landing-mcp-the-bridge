import React from "react";
import type { PillarResult } from "../../lib/scanner/core/schemas";
import { CheckCircle2, XCircle } from "lucide-react";

interface Props {
  pillars: PillarResult[];
}

const PILLAR_NAMES: Record<string, string> = {
  catalog: "Catálogo y Productos",
  semantic: "Estructura Semántica",
  speed: "Velocidad y Performance",
  accessibility: "Accesibilidad para Bots",
  ai_enrichment: "Enriquecimiento IA",
};

const CHECK_MESSAGES: Record<string, string> = {
  has_products: "Productos detectados públicamente",
  high_image_coverage: "Alta cobertura de imágenes",
  high_desc_coverage: "Descripciones completas",
  high_price_coverage: "Precios estructurados",
  high_category_coverage: "Categorización definida",
  has_json_ld: "Marcado JSON-LD (Schema.org)",
  has_open_graph: "Etiquetas Open Graph",
  ttfb_fast: "Respuesta inicial rápida (TTFB)",
  total_time_fast: "Tiempo de carga total óptimo",
  has_robots_txt: "Archivo robots.txt optimizado",
  has_sitemap_xml: "Sitemap XML indexable",
  requires_mcp_protocol: "No optimizado para Agentes IA",
  mcp_beacon_detected: "Señales de descubrimiento MCP detectadas",
  mcp_endpoint_exposed: "API Estructurada habilitada",
  mcp_ai_instructions: "Instrucciones de Agentes configuradas"
};

const CHECK_DESCRIPTIONS: Record<string, string> = {
  has_products: "Los agentes necesitan acceder a tu catálogo sin bloqueos (login o captchas) para poder recomendar tus artículos en conversaciones.",
  high_image_coverage: "Las imágenes permiten a los modelos de visión (como GPT-4o) analizar estéticamente y sugerir tus productos visualmente.",
  high_desc_coverage: "El texto descriptivo alimenta el contexto del LLM. Sin descripciones ricas, la IA no sabrá responder dudas sobre tu producto.",
  high_price_coverage: "El precio estructurado es crucial para que los agentes puedan comparar y ofrecer tu producto cuando un comprador pide 'opciones baratas'.",
  high_category_coverage: "Las categorías claras ayudan al modelo a entender la taxonomía de tu tienda y tu nicho de mercado de forma estructurada.",
  has_json_ld: "JSON-LD (Schema.org) es el idioma nativo de las máquinas. Sin él, los agentes tienen que 'adivinar' de qué trata tu página leyendo HTML desordenado.",
  has_open_graph: "Las etiquetas Open Graph aseguran que cuando un agente (o usuario) comparta tu link en un chat, se despliegue una tarjeta visual atractiva y no un link roto.",
  ttfb_fast: "Los agentes tienen tiempos de espera muy estrictos (timeouts). Un servidor lento causa que la IA abandone tu página antes de leerla.",
  total_time_fast: "Si tu web pesa demasiado o bloquea el renderizado, el agente consumirá demasiados recursos intentando leerla y descartará tu contenido.",
  has_robots_txt: "El archivo robots.txt es la puerta de entrada. Si no está optimizado, podrías estar bloqueando accidentalmente a los rastreadores de OpenAI, Anthropic o Google.",
  has_sitemap_xml: "El sitemap es el índice que guía a los agentes. Sin él, se pierden en el HTML y no indexan la totalidad de tus URLs.",
  requires_mcp_protocol: "Los LLMs son ineficientes leyendo HTML visual. El protocolo MCP les entrega tu catálogo como una base de datos JSON pura y perfecta en tiempo real.",
  mcp_beacon_detected: "Tu tienda emite una señal activa indicando a los agentes que es 'AI-Friendly', dándote prioridad técnica en el rastreo.",
  mcp_endpoint_exposed: "Has expuesto tu tienda como un sistema consultable, permitiendo a la IA verificar stock y precios al instante sin raspar la web.",
  mcp_ai_instructions: "Has definido reglas claras que guían el comportamiento ético y técnico de los agentes, evitando alucinaciones con tus productos."
};

export const isBridgeConnected = (pillars: PillarResult[]): boolean =>
  pillars.find((pillar) => pillar.pillar === "ai_enrichment")?.score === 25;

export function PillarCards({ pillars }: Props) {
  const bridgeConnected = isBridgeConnected(pillars);

  return (
    <div className="grid grid-cols-1 gap-8 w-full max-w-4xl mx-auto">
      {pillars.map((pillar) => {
        // Enriquecimiento IA (Locked State)
        if (pillar.pillar === "ai_enrichment" && !bridgeConnected) {
          return (
            <div key={pillar.pillar} className="surface-card-dark p-6 rounded-2xl border border-[rgba(249,115,22,0.2)] bg-[rgba(249,115,22,0.02)] flex flex-col transition-all duration-300">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--color-border)]">
                <h3 className="text-h3 font-medium flex items-center gap-2 text-[#f97316]">
                  {PILLAR_NAMES[pillar.pillar]}
                </h3>
                <div className="text-sm font-mono text-[#f97316] bg-[rgba(249,115,22,0.1)] px-3 py-1 rounded-lg border border-[rgba(249,115,22,0.2)]">Bloqueado</div>
              </div>

              <div className="flex-1 space-y-5 opacity-70">
                <div className="flex items-start gap-4">
                  <XCircle className="w-6 h-6 text-[var(--color-status-critical)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-base font-medium text-[var(--color-foreground)] mb-1">Falta capa semántica (MCP)</p>
                    <p className="text-sm text-[var(--color-foreground-muted)] leading-relaxed">
                      Conecta tu tienda al protocolo MCP para habilitar este análisis. {CHECK_DESCRIPTIONS['requires_mcp_protocol']}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        // Standard rendering for other pillars or Unlocked Enrichment
        return (
          <div key={pillar.pillar} className={`surface-card-dark p-6 rounded-2xl border flex flex-col ${pillar.pillar === 'ai_enrichment' ? 'border-[#f97316] bg-[rgba(249,115,22,0.05)]' : ''}`}>
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-[var(--color-border)]">
              <h3 className="text-h3 font-medium">{PILLAR_NAMES[pillar.pillar]}</h3>
              <div className="text-sm font-mono bg-[var(--color-background-tertiary)] px-3 py-1 rounded-lg border border-[var(--color-border)]">
                <span className={pillar.score === pillar.maxScore ? "text-[var(--color-status-stable)] font-bold text-lg" : "text-[var(--color-status-critical)] font-bold text-lg"}>
                  {pillar.score}
                </span>
                <span className="text-[var(--color-foreground-muted)] text-base"> / {pillar.maxScore}</span>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              {pillar.checks.map((check) => (
                <div key={check.id} className="flex items-start gap-4">
                  {check.passed ? (
                    <CheckCircle2 className="w-6 h-6 text-[var(--color-status-stable)] shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-[var(--color-status-critical)] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-base font-medium text-[var(--color-foreground)] mb-1 flex items-center gap-2">
                      {CHECK_MESSAGES[check.id] || check.id}
                      {/* Metric Badge Extraction */}
                      {check.details && (
                        (() => {
                          let badgeText = "";
                          if (check.details.includes('%')) {
                            badgeText = check.details.split(' - ')[0]; // E.g. "100% coverage"
                          } else if (check.details.includes('ms') || check.details.includes('Found')) {
                            badgeText = check.details.split(' - ')[0].replace('Failed', '').trim(); // E.g. "6668ms"
                          }
                          return badgeText ? (
                            <span className="text-xs font-mono bg-[var(--color-background-tertiary)] px-2 py-0.5 rounded text-[var(--color-foreground-muted)] border border-[var(--color-border)]">
                              {badgeText}
                            </span>
                          ) : null;
                        })()
                      )}
                    </p>

                    {/* Rich Description */}
                    {CHECK_DESCRIPTIONS[check.id] && (
                      <p className="text-sm text-[var(--color-foreground-subtle)] leading-relaxed mb-2">
                        {CHECK_DESCRIPTIONS[check.id]}
                      </p>
                    )}

                    {/* Recommendation details (if failed) */}
                    {check.details && check.details.includes('Recomendación:') && (
                      <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] p-3 rounded-lg mt-2">
                        <p className="text-sm text-[var(--color-status-critical)] leading-relaxed font-medium">
                          {check.details.substring(check.details.indexOf('Recomendación:')).trim()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
