import type { PillarResult } from "./schemas.js";

const RECOMMENDATIONS: Record<string, string> = {
  has_products: "Asegúrate de que tus productos tengan páginas públicas y enlazadas desde tu tienda.",
  high_image_coverage: "Añade imágenes destacadas de alta resolución a todos tus productos.",
  high_desc_coverage: "Incluye descripciones detalladas para facilitar que la Inteligencia Artificial comprenda tus productos.",
  high_price_coverage: "Revisa la configuración de tus precios para que estén visibles y correctamente estructurados.",
  high_category_coverage: "Clasifica todos tus productos en categorías claras y semánticas.",
  has_json_ld: "Implementa marcado de datos estructurados (Schema.org / JSON-LD) de tipo 'Product' en tus páginas.",
  has_open_graph: "Configura las etiquetas meta Open Graph (og:title, og:image) para optimizar cómo se comparten tus productos.",
  ttfb_fast: "Optimiza la respuesta de tu servidor o usa una CDN, tu Tiempo Hasta el Primer Byte (TTFB) es lento.",
  total_time_fast: "Reduce el peso de tu página (comprime imágenes, minifica scripts) para que cargue en menos de 2 segundos.",
  has_robots_txt: "Crea o repara tu archivo robots.txt en la raíz para permitir el rastreo a bots de IA y buscadores.",
  has_sitemap_xml: "Proporciona un archivo sitemap.xml público y válido para garantizar el descubrimiento de tus URLs."
};

/**
 * Pura function that intercepts scored pillars and injects human-readable
 * actionable recommendations into the 'details' field of failed checks.
 */
export function injectRecommendations(pillars: PillarResult[]): PillarResult[] {
  return pillars.map(pillar => {
    const updatedChecks = pillar.checks.map(check => {
      if (!check.passed && RECOMMENDATIONS[check.id]) {
        const advice = `Recomendación: ${RECOMMENDATIONS[check.id]}`;
        return {
          ...check,
          details: check.details ? `${check.details} - ${advice}` : advice
        };
      }
      return check;
    });

    return {
      ...pillar,
      checks: updatedChecks
    };
  });
}
